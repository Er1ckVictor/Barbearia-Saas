import { Router } from "express";
import { controller_usuarioLogin } from "../../controllers/auth/auth.controller.js";
import { controller_usuarioRegistro } from "../../controllers/auth/register.controller.js";
import { controller_usuarioLogout } from "../../controllers/auth/logout.controller.js";
import { controller_perfilObter, controller_perfilAtualizar, controller_senhaAlterar } from "../../controllers/user/profile.controller.js";
import { controller_validaToken } from "../../controllers/auth/refresh.controller.js"
import { authRateLimit, registerRateLimit, passwordRateLimit } from "../../middlewares/api/rateLimit.js";
import { supabaseAdmin } from "../../services/supabase/supabase.js";

export const authRoutes = Router();

authRoutes.post("/login", authRateLimit, controller_usuarioLogin)

authRoutes.post("/register", registerRateLimit, controller_usuarioRegistro)

authRoutes.post("/logout", controller_usuarioLogout)

// Perfil do usuário logado
authRoutes.get("/me", controller_validaToken, controller_perfilObter)

authRoutes.patch("/me", controller_validaToken, controller_perfilAtualizar)

authRoutes.patch("/password", controller_validaToken, passwordRateLimit, controller_senhaAlterar)

authRoutes.get("/check/token", controller_validaToken, async (req, res) => {

    const { id: userId, sessionId } = req.user
    const { code = null, message = null } = req.response || {}

    // Dados do perfil para o front exibir o usuário logado
    const { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("name, email")
        .eq("id", userId)
        .maybeSingle()

    if (profileError) {
        console.error("[check/token] Perfil:", profileError)
    }

    return res.status(200).json({
        success: true,
        message: message ? message : "Sessão válida",
        auth: {
            userId,
            sessionId
        },
        user: {
            id: userId,
            name: profile?.name ?? null,
            email: profile?.email ?? null
        },
        code: code ? code : "SESSION_VALID"
    })

})
