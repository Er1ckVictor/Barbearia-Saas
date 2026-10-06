import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";

import api from "../../../services/api.js";
import { useAuth } from "../../../contexts/AuthContext";
import "./Login.css";

// Mascara de telefone brasileiro: (11) 91234-5678
export function mascaraTelefone(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth, authenticated, loading } = useAuth();

  // Página para onde voltar depois do login (definida pelo ProtectedRoute), padrão é a home
  const destino = location.state?.from || "/home";

  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Se tiver letra ou @ trata como email, senão aplica máscara de telefone
  function alterarIdentificador(e) {
    const valor = e.target.value;
    const pareceEmail = /[a-zA-Z@]/.test(valor);
    setIdentificador(pareceEmail ? valor : mascaraTelefone(valor));
  }

  async function entrar(e) {
    e.preventDefault();
    setErro("");

    const valor = identificador.trim();
    const ehEmail = valor.includes("@");

    if (!valor || !senha) {
      setErro("Informe seu email ou telefone e a senha.");
      return;
    }

    if (ehEmail && !/^\S+@\S+\.\S+$/.test(valor)) {
      setErro("Digite um email válido.");
      return;
    }

    if (!ehEmail && valor.replace(/\D/g, "").length < 10) {
      setErro("Digite um telefone válido com DDD.");
      return;
    }

    setEnviando(true);

    try {
      // O backend atual espera "email"; para telefone envia "phone"
      const corpo = ehEmail
        ? { email: valor, password: senha, remember: lembrar }
        : { phone: valor.replace(/\D/g, ""), password: senha, remember: lembrar };

      await api.post("/user/login", corpo);
      await checkAuth();
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // Enquanto verifica a sessão não mostra o formulário, evita piscar a tela
  if (loading) return null;

  // Quem já está logado não precisa ver o login
  if (authenticated) return <Navigate to={destino} replace />;

  return (
    <div className="auth">
      <div className="auth-card">
        <Link to="/home" className="auth-marca">
          <span className="auth-marca-icone">A</span>
          Agendly
        </Link>

        <h1>Bem-vindo de volta</h1>
        <p className="auth-sub">Entre para ver e gerenciar seus agendamentos.</p>

        <form onSubmit={entrar} noValidate>
          <div className="auth-campo">
            <label htmlFor="identificador">Email ou telefone</label>
            <div className="auth-input">
              <FiUser aria-hidden="true" />
              <input
                id="identificador"
                type="text"
                autoComplete="username"
                placeholder="voce@email.com ou (11) 91234-5678"
                value={identificador}
                onChange={alterarIdentificador}
              />
            </div>
          </div>

          <div className="auth-campo">
            <label htmlFor="senha">Senha</label>
            <div className="auth-input">
              <FiLock aria-hidden="true" />
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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
          </div>

          <label className="auth-check">
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
            />
            <span className="auth-check-caixa" aria-hidden="true" />
            Lembrar de mim por 5 dias
          </label>

          {erro && (
            <div className="auth-erro" role="alert">
              <FiAlertCircle aria-hidden="true" />
              {erro}
            </div>
          )}

          <button type="submit" className="auth-botao" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-rodape">
          Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
