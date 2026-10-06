import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiUser, FiCalendar, FiLogOut } from "react-icons/fi";

import { useAuth } from "../../../contexts/AuthContext";
import { iniciais, primeiroNome } from "../../../utils/user.js";
import "./UserMenu.css";

// Perfil do usuário logado, com menu suspenso
export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const raiz = useRef(null);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return;

    function aoClicar(e) {
      if (raiz.current && !raiz.current.contains(e.target)) setAberto(false);
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function ir(rota) {
    setAberto(false);
    navigate(rota);
  }

  async function sair() {
    setSaindo(true);
    await logout();
    setSaindo(false);
    setAberto(false);
    navigate("/home", { replace: true });
  }

  const nome = user?.name;
  const email = user?.email;

  return (
    <div className="usermenu" ref={raiz}>
      <button
        type="button"
        className={`usermenu-botao ${aberto ? "aberto" : ""}`}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <span className="usermenu-avatar">{iniciais(nome, email)}</span>
        <span className="usermenu-nome">{primeiroNome(nome, email)}</span>
        <FiChevronDown className="usermenu-seta" aria-hidden="true" />
      </button>

      {aberto && (
        <div className="usermenu-painel" role="menu">
          <div className="usermenu-cabecalho">
            <span className="usermenu-avatar grande">{iniciais(nome, email)}</span>
            <div className="usermenu-dados">
              <strong>{nome || "Minha conta"}</strong>
              {email && <span>{email}</span>}
            </div>
          </div>

          <button type="button" role="menuitem" className="usermenu-item" onClick={() => ir("/my-account")}>
            <FiUser aria-hidden="true" />
            Minha conta
          </button>
          <button type="button" role="menuitem" className="usermenu-item" onClick={() => ir("/schedules")}>
            <FiCalendar aria-hidden="true" />
            Agendamentos
          </button>

          <div className="usermenu-divisor" />

          <button
            type="button"
            role="menuitem"
            className="usermenu-item sair"
            onClick={sair}
            disabled={saindo}
          >
            <FiLogOut aria-hidden="true" />
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
