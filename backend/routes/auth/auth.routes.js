import { Router } from "express";
import { controller_usuarioLogin } from "../../controllers/auth/auth.controller.js";
import { controller_validaToken } from "../../controllers/auth/refresh.controller.js"
import { authRateLimit } from "../../middlewares/api/rateLimit.js";

export const authRoutes = Router();

authRoutes.post("/login", authRateLimit, controller_usuarioLogin)

authRoutes.get("/check/token", controller_validaToken, (req, res) => {

    const { id: userId, sessionId } = req.user
    const { code = null, message = null } = req.response || {}

    return res.status(200).json({
        success: true,
        message: message ? message : "Sessão válida",
        auth: {
            userId,
            sessionId
        },
        code: code ? code : "SESSION_VALID"
    })

})