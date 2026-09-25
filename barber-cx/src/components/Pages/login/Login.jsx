import { useState } from "react";

import {
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaLock,
  FaPhone,
  FaCut,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";

import { FiMail } from "react-icons/fi";

import "./Login.css";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    console.log(isRegister ? "Cadastro" : "Login");
  }

  function toggleMode() {
    if (isAnimating) return;

    setIsAnimating(true);

    setTimeout(() => {
      setIsRegister((current) => !current);
      setShowPassword(false);
    }, 180);

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }

  return (
    <main className="auth-page">
      {/* Elementos decorativos */}
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <div className="auth-decoration auth-decoration-three" />

      <div className="auth-container">
        {/* ==================================================
            PAINEL ESQUERDO
        ================================================== */}

        <section className="auth-brand-panel">
          <div className="brand-panel-overlay" />

          <div className="brand-content">
            <div className="barber-logo">
              <span className="logo-line" />

              <FaCut className="logo-scissors" />

              <span className="logo-line" />
            </div>

            <span className="brand-small">
              BARBEARIA PREMIUM
            </span>

            <h1>
              Seu estilo.
              <br />
              <strong>Sua identidade.</strong>
            </h1>

            <p>
              Agende seu horário, acompanhe seus atendimentos
              e tenha uma experiência exclusiva na nossa barbearia.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <span className="feature-number">01</span>

                <div>
                  <strong>Agendamento fácil</strong>

                  <span>
                    Escolha o serviço e seu barbeiro.
                  </span>
                </div>
              </div>

              <div className="brand-feature">
                <span className="feature-number">02</span>

                <div>
                  <strong>Atendimento personalizado</strong>

                  <span>
                    Seu estilo em primeiro lugar.
                  </span>
                </div>
              </div>

              <div className="brand-feature">
                <span className="feature-number">03</span>

                <div>
                  <strong>Experiência premium</strong>

                  <span>
                    Mais praticidade para você.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-bottom">
            <span>EST. 2026</span>
            <span>•</span>
            <span>BARBER SHOP</span>
          </div>
        </section>

        {/* ==================================================
            FORMULÁRIO
        ================================================== */}

        <section className="auth-form-panel">
          <div
            className={`auth-form-wrapper ${
              isAnimating ? "form-transitioning" : ""
            }`}
          >
            {/* ==================================================
                LOGO MOBILE
            ================================================== */}

            <div className="mobile-logo">
              <div className="mobile-logo-icon">
                <FaCut />
              </div>

              <div>
                <strong>BARBER</strong>
                <span>SHOP</span>
              </div>
            </div>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="form-heading">
              <span className="form-eyebrow">
                {isRegister
                  ? "FAÇA PARTE DA NOSSA BARBEARIA"
                  : "BEM-VINDO DE VOLTA"}
              </span>

              <h2>
                {isRegister
                  ? "Crie sua conta"
                  : "Entre na sua conta"}
              </h2>

              <p>
                {isRegister
                  ? "Cadastre-se para começar a agendar seus horários."
                  : "Acesse sua conta para continuar seu atendimento."}
              </p>
            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              {/* Nome */}
              {isRegister && (
                <div className="form-field field-animation">
                  <label htmlFor="name">
                    Nome completo
                  </label>

                  <div className="input-box">
                    <span className="input-symbol">
                      <FaUser />
                    </span>

                    <input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Telefone */}
              <div className="form-field">
                <label htmlFor="phone">
                  Telefone
                </label>

                <div className="input-box">
                  <span className="input-symbol">
                    <FaPhone />
                  </span>

                  <input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {/* E-mail */}
              {isRegister && (
                <div className="form-field field-animation">
                  <label htmlFor="email">
                    E-mail
                  </label>

                  <div className="input-box">
                    <span className="input-symbol">
                      <FiMail />
                    </span>

                    <input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Senha */}
              <div className="form-field">
                <div className="password-header">
                  <label htmlFor="password">
                    Senha
                  </label>

                  {!isRegister && (
                    <button
                      type="button"
                      className="forgot-button"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>

                <div className="input-box">
                  <span className="input-symbol">
                    <FaLock />
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Digite sua senha"
                    autoComplete={
                      isRegister
                        ? "new-password"
                        : "current-password"
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar senha */}
              {isRegister && (
                <div className="form-field field-animation">
                  <label htmlFor="confirmPassword">
                    Confirmar senha
                  </label>

                  <div className="input-box">
                    <span className="input-symbol">
                      <FaLock />
                    </span>

                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Digite a senha novamente"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Checkbox */}
              {isRegister ? (
                <label className="check-option">
                  <input
                    type="checkbox"
                    required
                  />

                  <span>
                    Aceito os termos de uso e a política
                    de privacidade.
                  </span>
                </label>
              ) : (
                <label className="check-option">
                  <input type="checkbox" />

                  <span>
                    Manter conectado
                  </span>
                </label>
              )}

              {/* Botão */}
              <button
                type="submit"
                className="submit-button"
              >
                <span>
                  {isRegister
                    ? "Criar minha conta"
                    : "Entrar"}
                </span>

                <FaArrowRight />
              </button>
            </form>

            {/* ==================================================
                LOGIN / CADASTRO
            ================================================== */}

            <div className="switch-auth">
              <span>
                {isRegister
                  ? "Já possui uma conta?"
                  : "Ainda não possui uma conta?"}
              </span>

              <button
                type="button"
                onClick={toggleMode}
                disabled={isAnimating}
              >
                {isRegister
                  ? "Entrar"
                  : "Criar conta"}
              </button>
            </div>

            {/* ==================================================
                SEGURANÇA
            ================================================== */}

            <div className="auth-security">
              <FaShieldAlt />

              <span>
                Seus dados são protegidos com segurança.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}