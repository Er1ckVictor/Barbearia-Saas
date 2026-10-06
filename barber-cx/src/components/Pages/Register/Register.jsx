import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import api from "../../../services/api.js";
import { useAuth } from "../../../contexts/AuthContext";
// Reaproveita os estilos base (auth-*) definidos no Login.css
import "../login/Login.css";
import "./Register.css";

// Mascara de telefone: (11) 91234-5678
function mascaraTelefone(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

// Mascara de CPF: 000.000.000-00
function mascaraCpf(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

// Valida CPF pelos dígitos verificadores
function cpfValido(cpf) {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;

  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base; i++) soma += Number(n[i]) * (base + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(n[9]) && digito(10) === Number(n[10]);
}

// Nível da senha de 0 a 4
function forcaSenha(senha) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  return pontos;
}

const ROTULOS_FORCA = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];

function validar(v) {
  const e = {};

  if (v.nome.trim().split(/\s+/).length < 2) e.nome = "Informe nome e sobrenome.";
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Digite um email válido.";
  if (v.telefone.replace(/\D/g, "").length < 10) e.telefone = "Digite um telefone válido com DDD.";
  if (!cpfValido(v.cpf)) e.cpf = "CPF inválido.";
  if (v.senha.length < 8) e.senha = "A senha deve ter no mínimo 8 caracteres.";
  if (v.confirmacao !== v.senha || !v.confirmacao) e.confirmacao = "As senhas não coincidem.";

  return e;
}

export default function Register() {
  const navigate = useNavigate();
  const { authenticated, loading, checkAuth } = useAuth();

  const [valores, setValores] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: "",
    confirmacao: "",
  });
  const [erros, setErros] = useState({});
  const [tocados, setTocados] = useState({});
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const forca = forcaSenha(valores.senha);

  function alterar(campo, formatar) {
    return (e) => {
      const novo = { ...valores, [campo]: formatar ? formatar(e.target.value) : e.target.value };
      setValores(novo);
      if (tocados[campo]) setErros(validar(novo));
    };
  }

  function sair(campo) {
    return () => {
      setTocados((t) => ({ ...t, [campo]: true }));
      setErros(validar(valores));
    };
  }

  async function cadastrar(e) {
    e.preventDefault();
    setErroGeral("");

    const encontrados = validar(valores);
    setErros(encontrados);
    setTocados({ nome: true, email: true, telefone: true, cpf: true, senha: true, confirmacao: true });
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);

    try {
      await api.post("/user/register", {
        name: valores.nome.trim(),
        email: valores.email.trim().toLowerCase(),
        phone: valores.telefone.replace(/\D/g, ""),
        cpf: valores.cpf.replace(/\D/g, ""),
        password: valores.senha,
      });

      setSucesso(true);

      // Login automático após o cadastro (sem "lembrar de mim")
      try {
        await api.post("/user/login", {
          email: valores.email.trim().toLowerCase(),
          password: valores.senha,
          remember: false,
        });
        await checkAuth();
        navigate("/home", { replace: true });
      } catch {
        // Conta criada, mas o login automático falhou: segue para a tela de login
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setErroGeral(err.response?.data?.message || "Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // Campo de texto padrão
  // Chamado como função (não como componente) para o input não perder o foco a cada tecla
  function renderCampo({ id, label, Icone, tipo = "text", placeholder, autoComplete, inputMode }) {
    const invalido = tocados[id] && erros[id];
    return (
      <div key={id} className={`auth-campo ${invalido ? "invalido" : ""}`}>
        <label htmlFor={id}>{label}</label>
        <div className="auth-input">
          <Icone aria-hidden="true" />
          <input
            id={id}
            type={tipo}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={valores[id]}
            onChange={alterar(id, id === "telefone" ? mascaraTelefone : id === "cpf" ? mascaraCpf : null)}
            onBlur={sair(id)}
            aria-invalid={invalido ? "true" : "false"}
          />
        </div>
        {invalido && <span className="auth-msg">{erros[id]}</span>}
      </div>
    );
  }

  // Enquanto verifica a sessão não mostra o formulário
  if (loading) return null;

  // Quem já está logado não precisa se cadastrar (a tela de sucesso segue até o redirecionamento)
  if (authenticated && !sucesso) return <Navigate to="/home" replace />;

  if (sucesso) {
    return (
      <div className="auth">
        <div className="auth-card register-sucesso">
          <FiCheckCircle aria-hidden="true" />
          <h1>Conta criada!</h1>
          <p className="auth-sub">Entrando na sua conta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth-card largo">
        <Link to="/home" className="auth-marca">
          <span className="auth-marca-icone">A</span>
          Agendly
        </Link>

        <h1>Crie sua conta</h1>
        <p className="auth-sub">Leva menos de um minuto para começar a agendar.</p>

        <form onSubmit={cadastrar} noValidate>
          {renderCampo({ id: "nome", label: "Nome completo", Icone: FiUser, placeholder: "Seu nome e sobrenome", autoComplete: "name" })}

          <div className="register-linha">
            {renderCampo({ id: "email", label: "Email", Icone: FiMail, tipo: "email", placeholder: "voce@email.com", autoComplete: "email" })}
            {renderCampo({ id: "telefone", label: "Telefone", Icone: FiPhone, tipo: "tel", inputMode: "numeric", placeholder: "(11) 91234-5678", autoComplete: "tel" })}
          </div>

          {renderCampo({ id: "cpf", label: "CPF", Icone: FiCreditCard, inputMode: "numeric", placeholder: "000.000.000-00" })}

          <div className="register-linha">
            <div className={`auth-campo ${tocados.senha && erros.senha ? "invalido" : ""}`}>
              <label htmlFor="senha">Senha</label>
              <div className="auth-input">
                <FiLock aria-hidden="true" />
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  value={valores.senha}
                  onChange={alterar("senha")}
                  onBlur={sair("senha")}
                />
                <button
                  type="button"
                  className="auth-olho"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {tocados.senha && erros.senha && <span className="auth-msg">{erros.senha}</span>}

              {valores.senha && (
                <div className="forca" aria-live="polite">
                  <div className="forca-barras">
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} className={n <= forca ? "cheia" : ""} />
                    ))}
                  </div>
                  <span className="forca-texto">{ROTULOS_FORCA[forca]}</span>
                </div>
              )}
            </div>

            <div className={`auth-campo ${tocados.confirmacao && erros.confirmacao ? "invalido" : ""}`}>
              <label htmlFor="confirmacao">Confirmar senha</label>
              <div className="auth-input">
                <FiLock aria-hidden="true" />
                <input
                  id="confirmacao"
                  type={mostrarConfirmacao ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={valores.confirmacao}
                  onChange={alterar("confirmacao")}
                  onBlur={sair("confirmacao")}
                />
                <button
                  type="button"
                  className="auth-olho"
                  onClick={() => setMostrarConfirmacao((v) => !v)}
                  aria-label={mostrarConfirmacao ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarConfirmacao ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {tocados.confirmacao && erros.confirmacao && (
                <span className="auth-msg">{erros.confirmacao}</span>
              )}
            </div>
          </div>

          {erroGeral && (
            <div className="auth-erro" role="alert">
              <FiAlertCircle aria-hidden="true" />
              {erroGeral}
            </div>
          )}

          <button type="submit" className="auth-botao" disabled={enviando}>
            {enviando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-rodape">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
