import { supabaseAdmin } from "../../services/supabase/supabase.js";

import { clearSessionCookies } from "../../middlewares/api/cookies.js";


// Logout do usuário
export async function controller_usuarioLogout(req, res) {

    try {

        const access_token = req.cookies.access_token;

        if (access_token) {

            // Lê os dados do token (mesmo expirado, a assinatura continua sendo verificada)
            const { data } = await supabaseAdmin.auth.getClaims(access_token, { allowExpired: true });

            const sessionId = data?.claims?.session_id;

            // Remove a sessão do banco
            if (sessionId) {

                const { error: deleteError } = await supabaseAdmin
                    .from("sessions")
                    .delete()
                    .eq("session_id", sessionId);

                if (deleteError) {
                    console.error("[controller_usuarioLogout] Delete:", deleteError);
                }
            }

            // Revoga apenas a sessão atual no Supabase ("local" não afeta outros dispositivos)
            try {
                await supabaseAdmin.auth.admin.signOut(access_token, "local");
            } catch (signOutError) {
                console.error("[controller_usuarioLogout] SignOut:", signOutError);
            }
        }

    }

    catch (error) {

        console.error("[controller_usuarioLogout] Error:", error);
    }

    // Sempre limpa os cookies, mesmo se algo acima falhar
    clearSessionCookies(res);

    return res.status(200).json({
        success: true,
        message: "Logout realizado com sucesso",
        code: "LOGOUT_SUCCESS"
    });
}
