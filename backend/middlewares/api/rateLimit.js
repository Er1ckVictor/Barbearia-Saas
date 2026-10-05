import rateLimit from "express-rate-limit";
import { clearSessionCookies } from "./cookies.js";

// Rate limit para autenticação
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 5, // 5 requisições,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: false,
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