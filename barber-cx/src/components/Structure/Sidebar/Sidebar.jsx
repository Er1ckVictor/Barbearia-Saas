import { FiHome, FiUser, FiCalendar, FiSettings } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";
import { iniciais, primeiroNome } from "../../../utils/user.js";
import "./Sidebar.css";

// Links da navegação: "to" é a rota de destino e "activated" são os trechos da URL que marcam o item ativo
const LINKS = [
  { id: "inicio", to: "/home", activated: ["home"], nome: "Início", Icone: FiHome },
  { id: "conta", to: "/my-account", activated: ["login", "my-account", "register"], nome: "Minha conta", Icone: FiUser },
  { id: "agendamentos", to: "/schedules", activated: ["schedules"], nome: "Agendamentos", Icone: FiCalendar },
  { id: "configuracoes", to: "/settings", activated: ["settings"], nome: "Configurações", Icone: FiSettings },
];

// Sidebar horizontal flutuante, ícone acima e texto abaixo
export default function Sidebar() {

  const location = useLocation();
  const navigate = useNavigate();
  const { authenticated, user } = useAuth();

  return (

    <nav className="sidebar" aria-label="Navegação principal">

      {LINKS.map(({ id, to, nome, activated, Icone }) => {

        const ativo = activated.some((trecho) => location.pathname.includes(trecho));

        // "Minha conta" vira o perfil do usuário quando logado, ou leva ao login quando deslogado
        const ehConta = id === "conta";
        const logado = ehConta && authenticated;
        const destino = ehConta && !authenticated ? "/login" : to;
        const texto = logado ? primeiroNome(user?.name, user?.email) : nome;

        return (
          <button
            key={id}
            type="button"
            className={`sidebar-link ${ativo ? "ativo" : ""}`}
            onClick={() => navigate(destino)}
            aria-current={ativo ? "page" : undefined}>

            <span className="sidebar-icone">
              {logado ? (
                <span className="sidebar-avatar">{iniciais(user?.name, user?.email)}</span>
              ) : (
                <Icone aria-hidden="true" />
              )}
            </span>

            <span className="sidebar-texto">{texto}</span>

          </button>
        );
      })}

    </nav>
  );
}
