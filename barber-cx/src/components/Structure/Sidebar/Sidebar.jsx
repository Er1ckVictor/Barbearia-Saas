// CSS
import "./Sidebar.css";

// React Router
import { Link } from "react-router-dom";

// Icons
import { RiMenuUnfold2Line, RiMenuFold2Line } from "react-icons/ri"; // Ocultar | Mostrar
import { HiScissors } from "react-icons/hi";
import {
    RiDashboardLine,
    RiUserSearchLine,
    RiCalendarScheduleLine,
    RiScissors2Line,
    RiMoneyDollarCircleLine,
    RiBarChartBoxLine,
    RiStarLine,
} from "react-icons/ri";

import { FiShield } from "react-icons/fi";

import { LiaUserSolid } from "react-icons/lia";
import { MdAttachMoney } from "react-icons/md";
import { LuSettings } from "react-icons/lu";
import { useState } from "react";

// Menus
const sidebarMenu = [
    {
        title: "Visão geral",
        titleAlt: "Geral",
        links: [
            {
                label: "Dashboard",
                path: "/dashboard",
                icon: <RiDashboardLine size={22} />,
            },
        ],
    },

    {
        title: "Atendimento",
        titleAlt: "Aten",
        links: [
            {
                label: "Agendamentos",
                path: "/agendamentos",
                icon: <RiCalendarScheduleLine size={22} />,
            },
            {
                label: "Clientes",
                path: "/clientes",
                icon: <RiUserSearchLine size={22} />,
            },
            {
                label: "Serviços",
                path: "/servicos",
                icon: <RiScissors2Line size={22} />,
            },
            {
                label: "Barbeiros",
                path: "/barbeiros",
                icon: <LiaUserSolid size={22} />,
            },
        ],
    },

    {
        title: "Gestão",
        titleAlt: "Gest",
        links: [
            {
                label: "Vendas",
                path: "/vendas",
                icon: <MdAttachMoney size={22} />,
            },
            {
                label: "Faturamento",
                path: "/faturamento",
                icon: <RiMoneyDollarCircleLine size={22} />,
            },
            {
                label: "Relatórios",
                path: "/relatorios",
                icon: <RiBarChartBoxLine size={22} />,
            },
            {
                label: "Avaliações",
                path: "/avaliacoes",
                icon: <RiStarLine size={22} />,
            },
        ],
    },

    {
        title: "Usuário",
        titleAlt: "Usu",
        links: [
            {
                label: "Perfil",
                path: "/perfil",
                icon: <LiaUserSolid size={24} />,
            },
            {
                label: "Regras",
                path: "/rules",
                icon: <FiShield size={24}/>
            },
            {
                label: "Configurações",
                path: "/configuracoes",
                icon: <LuSettings size={22} />,
            },
        ],
    },
];

// Component
export default function Sidebar() {

    // States
    const [showSide, setShowSide] = useState(false)

    return (
        <aside className={showSide ? "sidebar-content" : "sidebar-content hidden"}>
            <div className="title-box">
                {showSide && (<h2 className="title-sidebar">Barber <HiScissors /></h2>)}
                <span onClick={() => setShowSide(showSide ? false : true)} className="hiddenMenu"><RiMenuUnfold2Line size={22} /></span>
            </div>

            <nav className="link-group">
                {sidebarMenu.map((menu) => (
                    <div className="links" key={menu.title}>
                        {showSide ? (
                            <span className="link-title">
                                {menu.title}
                            </span>) : (
                            <span className="link-title">
                                {menu.titleAlt}
                            </span>)}

                        {menu.links.map((item) => (
                            <Link
                                style={{ color: 'black', textDecoration: 'none' }}
                                to={item.path}
                                className={item.path == location.pathname ? "link active" : "link"}
                                key={item.path}
                            >
                                <div className="link-img">
                                    {item.icon}
                                </div>

                                {showSide && (<span className="link-label">
                                    {item.label}
                                </span>)}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
        </aside>
    );
}