import rateLimit from "express-rate-limit";
import { clearSessionCookies } from "./cookies.js";

// Rate limit para autenticação
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 5, // 5 requisições,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {

        // Limpa cookies de sessão
        clearSessionCookies(res)

        // RETORNO
        return res.status(429).json({
            success: false,
            message: "Tentativas de login esgotadas. Tente novamente mais tarde."
        })
    }
})

// Rate limit para cadastro (contador separado do login)
export const registerRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: 10, // 10 cadastros por IP
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => {

        return res.status(429).json({
            success: false,
            message: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
            code: "REGISTER_RATE_LIMIT"
        })
    }
})

// Rate limit para troca de senha
export const passwordRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 5, // 5 tentativas
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => {

        return res.status(429).json({
            success: false,
            message: "Muitas tentativas de troca de senha. Tente novamente mais tarde.",
            code: "PASSWORD_RATE_LIMIT"
        })
    }
})
