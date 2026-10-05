import { useState, useMemo } from "react";
import {
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiArrowUpRight,
  FiClock,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import {
  FaScissors,
  FaWandMagicSparkles,
  FaHandSparkles,
  FaEye,
  FaFeatherPointed,
  FaPalette,
  FaFaceSmile,
  FaPenNib,
  FaGem,
  FaSpa,
  FaHandHoldingHeart,
  FaHeartPulse,
  FaTooth,
  FaBrain,
  FaAppleWhole,
  FaDumbbell,
  FaPersonPraying,
  FaFutbol,
  FaPaw,
  FaCarSide,
  FaWrench,
  FaCamera,
  FaGraduationCap,
} from "react-icons/fa6";
import Sidebar from "../../Structure/Sidebar/Sidebar";
import "./Home.css";

// Nome provisório do SaaS, altere aqui quando definir o definitivo
const NOME_MARCA = "Agendly";

// Grupos usados nos filtros acima da lista de categorias
const GRUPOS = [
  { id: "todas", nome: "Todas" },
  { id: "beleza", nome: "Beleza" },
  { id: "saude", nome: "Saúde e bem-estar" },
  { id: "fitness", nome: "Esporte e fitness" },
  { id: "outros", nome: "Outros serviços" },
];

// Categorias de serviços com agendamento, cada uma com sua cor e cor de fundo suave
const CATEGORIAS = [
  { id: "barbearia", grupo: "beleza", nome: "Barbearias", Icone: FaScissors, cor: "#18181b", fundo: "#f4f4f5", descricao: "Corte, barba e acabamento com horário marcado." },
  { id: "salao", grupo: "beleza", nome: "Salões de beleza", Icone: FaWandMagicSparkles, cor: "#7c3aed", fundo: "#f5f3ff", descricao: "Cabelo, coloração, escova e tratamentos." },
  { id: "manicure", grupo: "beleza", nome: "Manicure e pedicure", Icone: FaHandSparkles, cor: "#db2777", fundo: "#fdf2f8", descricao: "Esmaltação, unhas em gel e alongamento." },
  { id: "sobrancelha", grupo: "beleza", nome: "Sobrancelhas e cílios", Icone: FaEye, cor: "#92400e", fundo: "#fef3e2", descricao: "Design, henna, lash lifting e extensão." },
  { id: "depilacao", grupo: "beleza", nome: "Depilação", Icone: FaFeatherPointed, cor: "#e11d48", fundo: "#fff1f2", descricao: "Cera, laser e outros métodos de depilação." },
  { id: "maquiagem", grupo: "beleza", nome: "Maquiagem", Icone: FaPalette, cor: "#c026d3", fundo: "#fdf4ff", descricao: "Make para eventos, noivas e produções." },
  { id: "estetica", grupo: "beleza", nome: "Estética facial e corporal", Icone: FaFaceSmile, cor: "#0d9488", fundo: "#f0fdfa", descricao: "Limpeza de pele, peeling e tratamentos." },
  { id: "tatuagem", grupo: "beleza", nome: "Estúdios de tatuagem", Icone: FaPenNib, cor: "#dc2626", fundo: "#fef2f2", descricao: "Tatuadores e estúdios de diversos estilos." },
  { id: "piercing", grupo: "beleza", nome: "Piercing", Icone: FaGem, cor: "#4f46e5", fundo: "#eef2ff", descricao: "Perfuração segura e joias de qualidade." },

  { id: "spa", grupo: "saude", nome: "Spas e day spa", Icone: FaSpa, cor: "#059669", fundo: "#ecfdf5", descricao: "Banhos, rituais e dias de relaxamento." },
  { id: "massagem", grupo: "saude", nome: "Massagens", Icone: FaHandHoldingHeart, cor: "#ea580c", fundo: "#fff7ed", descricao: "Relaxante, terapêutica e desportiva." },
  { id: "fisioterapia", grupo: "saude", nome: "Fisioterapia", Icone: FaHeartPulse, cor: "#0891b2", fundo: "#ecfeff", descricao: "Reabilitação, pilates clínico e quiropraxia." },
  { id: "odontologia", grupo: "saude", nome: "Odontologia", Icone: FaTooth, cor: "#0284c7", fundo: "#f0f9ff", descricao: "Consultas, limpezas e tratamentos dentários." },
  { id: "psicologia", grupo: "saude", nome: "Psicologia e terapias", Icone: FaBrain, cor: "#9333ea", fundo: "#faf5ff", descricao: "Atendimento presencial e online." },
  { id: "nutricao", grupo: "saude", nome: "Nutrição", Icone: FaAppleWhole, cor: "#65a30d", fundo: "#f7fee7", descricao: "Consultas e acompanhamento alimentar." },

  { id: "personal", grupo: "fitness", nome: "Personal trainers", Icone: FaDumbbell, cor: "#2563eb", fundo: "#eff6ff", descricao: "Treinos individuais e acompanhamento." },
  { id: "yoga", grupo: "fitness", nome: "Yoga e pilates", Icone: FaPersonPraying, cor: "#ca8a04", fundo: "#fefce8", descricao: "Aulas em estúdio, em grupo ou particulares." },
  { id: "quadras", grupo: "fitness", nome: "Quadras esportivas", Icone: FaFutbol, cor: "#16a34a", fundo: "#f0fdf4", descricao: "Reserva de quadras, campos e arenas." },

  { id: "pet", grupo: "outros", nome: "Pet shops e veterinários", Icone: FaPaw, cor: "#d97706", fundo: "#fffbeb", descricao: "Banho, tosa, consultas e vacinas." },
  { id: "automotivo", grupo: "outros", nome: "Estética automotiva", Icone: FaCarSide, cor: "#1e40af", fundo: "#eff6ff", descricao: "Lavagem, polimento e higienização." },
  { id: "oficina", grupo: "outros", nome: "Oficinas mecânicas", Icone: FaWrench, cor: "#78716c", fundo: "#f5f5f4", descricao: "Revisões, manutenção e diagnósticos." },
  { id: "fotografia", grupo: "outros", nome: "Estúdios de fotografia", Icone: FaCamera, cor: "#334155", fundo: "#f1f5f9", descricao: "Ensaios, retratos e fotos profissionais." },
  { id: "aulas", grupo: "outros", nome: "Aulas e cursos", Icone: FaGraduationCap, cor: "#c2410c", fundo: "#fff7ed", descricao: "Reforço, idiomas, música e mais." },
];

// Destaques exibidos abaixo da barra de busca
const DESTAQUES = [
  { Icone: FiMapPin, texto: "Busque pela sua região" },
  { Icone: FiClock, texto: "Horários em tempo real" },
  { Icone: FiCheckCircle, texto: "Confirmação imediata" },
];

// Card de categoria, a cor da categoria entra por variáveis CSS
function CardCategoria({ categoria, ativo, aoSelecionar }) {
  const { Icone, nome, descricao, id, cor, fundo } = categoria;
  return (
    <button
      type="button"
      className={`card ${ativo ? "ativo" : ""}`}
      style={{ "--cat": cor, "--cat-soft": fundo }}
      onClick={() => aoSelecionar(id)}
      aria-pressed={ativo}
    >
      <div className="card-topo">
        <div className="card-icone">
          <Icone aria-hidden="true" />
        </div>
        <FiArrowRight className="card-seta" aria-hidden="true" />
      </div>
      <h3>{nome}</h3>
      <p>{descricao}</p>
    </button>
  );
}

export default function Home() {
  const [busca, setBusca] = useState("");
  const [grupoAtivo, setGrupoAtivo] = useState("todas");
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [rotaAtiva, setRotaAtiva] = useState("inicio");

  // Categoria selecionada, usada para mostrar o filtro ativo na busca
  const categoriaSelecionada = CATEGORIAS.find((c) => c.id === categoriaAtiva);

  // Filtra as categorias pelo grupo escolhido e pelo texto da busca
  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return CATEGORIAS.filter((c) => {
      const noGrupo = grupoAtivo === "todas" || c.grupo === grupoAtivo;
      const noTexto =
        !termo ||
        c.nome.toLowerCase().includes(termo) ||
        c.descricao.toLowerCase().includes(termo);
      return noGrupo && noTexto;
    });
  }, [busca, grupoAtivo]);

  // Envio da busca, aqui entra o redirecionamento para a página de resultados
  function pesquisar(e) {
    e.preventDefault();
    console.log("Pesquisar:", { busca, categoriaAtiva });
  }

  // Seleciona a categoria, clicar de novo desmarca
  function alternarCategoria(id) {
    setCategoriaAtiva((atual) => (atual === id ? null : id));
  }

  return (
    <div className="home">
      <header className="topo">
        <div className="logo">
          <div className="logo-marca">
            <FiCalendar aria-hidden="true" />
          </div>
          {NOME_MARCA}
        </div>
        <div className="topo-acoes">
          <button type="button" className="topo-link">
            Para profissionais
          </button>
          <button type="button" className="botao-escuro">
            Entrar
          </button>
        </div>
      </header>

      <section className="hero">
        <span className="selo">Agendamento online</span>
        <h1>
          Agende seu próximo atendimento{" "}
          <span className="suave">em poucos cliques.</span>
        </h1>
        <p>
          Encontre barbearias, salões, estúdios, clínicas e muito mais perto de
          você, com horários e valores sempre à vista.
        </p>

        <form className="busca" onSubmit={pesquisar} role="search">
          <FiSearch className="busca-icone" aria-hidden="true" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Busque por serviço, profissional ou estabelecimento"
            aria-label="Pesquisar"
          />
          <button type="submit" className="botao-escuro">
            Buscar
          </button>
        </form>

        {categoriaSelecionada && (
          <div className="filtro-ativo">
            <span>Categoria:</span>
            <strong style={{ color: categoriaSelecionada.cor }}>
              {categoriaSelecionada.nome}
            </strong>
            <button
              type="button"
              onClick={() => setCategoriaAtiva(null)}
              aria-label="Remover categoria"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
        )}

        <ul className="destaques">
          {DESTAQUES.map(({ Icone, texto }) => (
            <li key={texto}>
              <Icone aria-hidden="true" />
              {texto}
            </li>
          ))}
        </ul>
      </section>

      <main className="secao">
        <div className="secao-topo">
          <div>
            <h2>Explore por categoria</h2>
            <p>Escolha o tipo de serviço que você procura.</p>
          </div>
          <span className="contagem">
            {categoriasFiltradas.length}{" "}
            {categoriasFiltradas.length === 1 ? "categoria" : "categorias"}
          </span>
        </div>

        <div className="chips" role="tablist" aria-label="Grupos de categorias">
          {GRUPOS.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={grupoAtivo === g.id}
              className={`chip ${grupoAtivo === g.id ? "ativo" : ""}`}
              onClick={() => setGrupoAtivo(g.id)}
            >
              {g.nome}
            </button>
          ))}
        </div>

        <div className="grid">
          {categoriasFiltradas.length > 0 ? (
            categoriasFiltradas.map((cat) => (
              <CardCategoria
                key={cat.id}
                categoria={cat}
                ativo={categoriaAtiva === cat.id}
                aoSelecionar={alternarCategoria}
              />
            ))
          ) : (
            <div className="vazio">
              Nenhuma categoria encontrada para “{busca}”. Tente outro termo.
            </div>
          )}
        </div>
      </main>

      <section className="cta">
        <div className="cta-conteudo">
          <div>
            <h2>Tem uma barbearia, salão ou estúdio?</h2>
            <p>
              Cadastre sua organização e receba agendamentos online, com agenda,
              serviços e clientes em um só lugar.
            </p>
          </div>
          <button type="button" className="botao-claro">
            Cadastrar minha organização
            <FiArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <footer className="rodape">
        © 2026 {NOME_MARCA}. Todos os direitos reservados.
      </footer>

      <Sidebar ativo={rotaAtiva} aoNavegar={setRotaAtiva} />
    </div>
  );
}
