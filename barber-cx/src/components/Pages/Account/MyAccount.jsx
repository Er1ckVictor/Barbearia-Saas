import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiLogOut,
} from "react-icons/fi";

import api from "../../../services/api.js";
import { useAuth } from "../../../contexts/AuthContext";
import { iniciais, mascaraTelefone } from "../../../utils/user.js";
// Reaproveita os estilos de campo e botão (auth-*) do Login.css
import "../login/Login.css";
import "./MyAccount.css";

// Campo de senha com botão de mostrar/ocultar (fora do componente principal para não perder o foco)
function CampoSenha({ id, label, valor, aoAlterar, autoComplete, placeholder }) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <div className="auth-campo">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input">
        <FiLock aria-hidden="true" />
        <input
          id={id}
          type={mostrar ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => aoAlterar(e.target.value)}
        />
        <button
          type="button"
          className="auth-olho"
          onClick={() => setMostrar((v) => !v)}
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
        >
          {mostrar ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}

// Aviso de sucesso ou erro dentro de um cartão
function Aviso({ msg }) {
  if (!msg) return null;
  const sucesso = msg.tipo === "ok";

  return (
    <div className={sucesso ? "conta-ok" : "auth-erro"} role={sucesso ? "status" : "alert"}>
      {sucesso ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
      {msg.texto}
    </div>
  );
}

export default function MyAccount() {
  const navigate = useNavigate();
  const { checkAuth, logout } = useAuth();

  // Perfil carregado do backend
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");

  // Dados pessoais
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState(null);

  // Senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState(null);

  // Carrega o perfil ao abrir a página
  useEffect(() => {
    let cancelado = false;

    api
      .get("/user/me")
      .then(({ data }) => {
        if (cancelado) return;
        setPerfil(data.profile);
        setNome(data.profile.name ?? "");
        setTelefone(mascaraTelefone(data.profile.phone));
      })
      .catch((err) => {
        if (cancelado) return;
        // Sessão expirada: atualiza o estado e o ProtectedRoute leva ao login
        if (err.response?.status === 401) {
          checkAuth();
          return;
        }
        setErroCarga(err.response?.data?.message || "Não foi possível carregar seus dados.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trata erro de requisição: 401 volta ao login, o resto vira mensagem
  function tratarErro(err, definirMsg, padrao) {
    if (err.response?.status === 401) {
      checkAuth();
      return;
    }
    definirMsg({ tipo: "erro", texto: err.response?.data?.message || padrao });
  }

  // Só habilita salvar se algo mudou
  const alterou =
    perfil &&
    (nome.trim() !== (perfil.name ?? "") || telefone.replace(/\D/g, "") !== (perfil.phone ?? ""));

  async function salvarPerfil(e) {
    e.preventDefault();
    setMsgPerfil(null);

    if (nome.trim().split(/\s+/).length < 2) {
      setMsgPerfil({ tipo: "erro", texto: "Informe nome e sobrenome." });
      return;
    }

    if (telefone.replace(/\D/g, "").length < 10) {
      setMsgPerfil({ tipo: "erro", texto: "Digite um telefone válido com DDD." });
      return;
    }

    setSalvando(true);

    try {
      const { data } = await api.patch("/user/me", {
        name: nome.trim(),
        phone: telefone.replace(/\D/g, ""),
      });

      setPerfil(data.profile);
      setNome(data.profile.name);
      setTelefone(mascaraTelefone(data.profile.phone));

      // Atualiza o nome exibido no menu de perfil e na Sidebar
      await checkAuth();

      setMsgPerfil({ tipo: "ok", texto: "Dados atualizados com sucesso." });
    } catch (err) {
      tratarErro(err, setMsgPerfil, "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSenha(e) {
    e.preventDefault();
    setMsgSenha(null);

    if (!senhaAtual) {
      setMsgSenha({ tipo: "erro", texto: "Informe a senha atual." });
      return;
    }

    if (novaSenha.length < 8) {
      setMsgSenha({ tipo: "erro", texto: "A nova senha deve ter no mínimo 8 caracteres." });
      return;
    }

    if (novaSenha === senhaAtual) {
      setMsgSenha({ tipo: "erro", texto: "A nova senha deve ser diferente da atual." });
      return;
    }

    if (novaSenha !== confirmacao) {
      setMsgSenha({ tipo: "erro", texto: "As senhas não coincidem." });
      return;
    }

    setAlterandoSenha(true);

    try {
      await api.patch("/user/password", {
        currentPassword: senhaAtual,
        newPassword: novaSenha,
      });

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setMsgSenha({
        tipo: "ok",
        texto: "Senha alterada. Seus outros dispositivos foram desconectados.",
      });
    } catch (err) {
      tratarErro(err, setMsgSenha, "Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setAlterandoSenha(false);
    }
  }

  async function sair() {
    await logout();
    navigate("/home", { replace: true });
  }

  return (
    <div className="conta">
      <Link to="/home" className="conta-voltar">
        <FiArrowLeft aria-hidden="true" />
        Voltar
      </Link>

      {carregando && <p className="conta-estado">Carregando seus dados...</p>}

      {!carregando && erroCarga && (
        <div className="auth-erro" role="alert">
          <FiAlertCircle aria-hidden="true" />
          {erroCarga}
        </div>
      )}

      {!carregando && perfil && (
        <>
          <header className="conta-topo">
            <span className="conta-avatar">{iniciais(perfil.name, perfil.email)}</span>
            <div>
              <h1>{perfil.name}</h1>
              <p>{perfil.email}</p>
            </div>
          </header>

          <section className="conta-cartao">
            <h2>Dados pessoais</h2>
            <p className="conta-desc">Email e CPF não podem ser alterados por aqui.</p>

            <form onSubmit={salvarPerfil} noValidate>
              <div className="auth-campo">
                <label htmlFor="nome">Nome completo</label>
                <div className="auth-input">
                  <FiUser aria-hidden="true" />
                  <input
                    id="nome"
                    type="text"
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
              </div>

              <div className="conta-linha">
                <div className="auth-campo">
                  <label htmlFor="telefone">Telefone</label>
                  <div className="auth-input">
                    <FiPhone aria-hidden="true" />
                    <input
                      id="telefone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                    />
                  </div>
                </div>

                <div className="auth-campo">
                  <label htmlFor="cpf">CPF</label>
                  <div className="auth-input bloqueado">
                    <FiCreditCard aria-hidden="true" />
                    <input id="cpf" type="text" value={perfil.cpf ?? ""} disabled />
                  </div>
                </div>
              </div>

              <div className="auth-campo">
                <label htmlFor="email">Email</label>
                <div className="auth-input bloqueado">
                  <FiMail aria-hidden="true" />
                  <input id="email" type="email" value={perfil.email ?? ""} disabled />
                </div>
              </div>

              <Aviso msg={msgPerfil} />

              <button type="submit" className="auth-botao conta-botao" disabled={salvando || !alterou}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          </section>

          <section className="conta-cartao">
            <h2>Segurança</h2>
            <p className="conta-desc">Ao trocar a senha, os outros dispositivos conectados são desconectados.</p>

            <form onSubmit={alterarSenha} noValidate>
              <CampoSenha
                id="senha-atual"
                label="Senha atual"
                valor={senhaAtual}
                aoAlterar={setSenhaAtual}
                autoComplete="current-password"
                placeholder="Sua senha atual"
              />

              <div className="conta-linha">
                <CampoSenha
                  id="nova-senha"
                  label="Nova senha"
                  valor={novaSenha}
                  aoAlterar={setNovaSenha}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                />
                <CampoSenha
                  id="confirmacao-senha"
                  label="Confirmar nova senha"
                  valor={confirmacao}
                  aoAlterar={setConfirmacao}
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                />
              </div>

              <Aviso msg={msgSenha} />

              <button type="submit" className="auth-botao conta-botao" disabled={alterandoSenha}>
                {alterandoSenha ? "Alterando..." : "Alterar senha"}
              </button>
            </form>
          </section>

          <button type="button" className="conta-sair" onClick={sair}>
            <FiLogOut aria-hidden="true" />
            Sair da conta
          </button>
        </>
      )}
    </div>
  );
}
