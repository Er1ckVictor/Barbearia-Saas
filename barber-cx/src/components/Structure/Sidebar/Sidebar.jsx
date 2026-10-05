import { FiHome, FiUser, FiCalendar, FiSettings } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import "./Sidebar.css";

// Links da navegação, o id é usado para marcar o item ativo
const LINKS = [
  { id: "inicio", activated: ["home"], nome: "Início", Icone: FiHome },
  { id: "conta", activated: ["login", "my-account", "register"], nome: "Minha conta", Icone: FiUser },
  { id: "agendamentos", activated: ["schedules"], nome: "Agendamentos", Icone: FiCalendar },
  { id: "configuracoes", activated: ["settings"], nome: "Configurações", Icone: FiSettings },
];

// Sidebar horizontal flutuante, ícone acima e texto abaixo
export default function Sidebar({ ativo, aoNavegar }) {

  // Location
  const location = useLocation();

  return (

    <nav className="sidebar" aria-label="Navegação principal">

      {LINKS.map(({ id, nome, activated, Icone }) => (

        <button
          key={id}
          type="button"
          className={`sidebar-link ${location.pathname.includes(activated) ? "ativo" : ""}`}
          onClick={() => aoNavegar(id)}
          aria-current={ativo === id ? "page" : undefined}>

          <span className="sidebar-icone">
            <Icone aria-hidden="true" />
          </span>

          <span className="sidebar-texto">{nome}</span>

        </button>
      ))}

    </nav>
  );
}
