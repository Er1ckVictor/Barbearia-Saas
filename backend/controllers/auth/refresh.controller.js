import bcrypt from "bcrypt";

import { supabaseAdmin, supabaseClient } from "../../services/supabase/supabase.js";

import {
    clearSessionCookies,
    setSessionCookies
} from "../../middlewares/api/cookies.js";


// Valida token
export async function controller_validaToken(req, res, next) {

    try {

        // Dados do cookie
        const access_token = req.cookies.access_token;

        // Access token?
        if (!access_token) {

            clearSessionCookies(res);

            return res.status(401).json({
                success: false,
                message: "Token é obrigatório",
                code: "TOKEN_REQUIRED"
            });

        }

        // Valida token
        const {
            data: claimsData,
            error: claimsError
        } =
            await supabaseAdmin.auth.getClaims(
                access_token
            );

        // Token inválido ou expirado
        if (claimsError || !claimsData?.claims) {

            // Verifica se o token é legítimo, porém expirado
            const { data: expiredData, error: expiredError } = await supabaseAdmin.auth.getClaims(access_token, { allowExpired: true });

            // Token inválido
            if (expiredError || !expiredData?.claims) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Token inválido",
                    code: "TOKEN_INVALID"
                });
            }

            // Claims do token expirado
            const { claims } = expiredData;

            // Tempo atual
            const now = Math.floor(Date.now() / 1000);

            // Verifica expiração
            if (!claims.exp || claims.exp > now) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão expirada",
                    code: "SESSION_EXPIRED"
                });
            }

            // Session ID
            const sessionId = claims.session_id;

            // Verifica Session ID
            if (!sessionId) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão inválida",
                    code: "SESSION_ID_MISSING"
                });
            }


            // Busca sessão no banco
            const { data: sessionsData, error: sessionsError } = await supabaseAdmin.from("sessions")
                .select(
                    "user_id, session_id, refresh_token_hash, remember, expires_at"
                )
                .eq(
                    "session_id",
                    sessionId
                )
                .maybeSingle();


            // Erro no banco
            if (sessionsError) {

                return res.status(500).json({
                    success: false,
                    message: "Erro ao consultar sessão",
                    code: "SESSION_DATABASE_ERROR"
                });
            }

            // Sessão não encontrada
            if (!sessionsData) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão não encontrada",
                    code: "SESSION_NOT_FOUND"
                });
            }

            // Verifica usuário da sessão
            if (sessionsData.user_id !== claims.sub) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão inválida",
                    code: "INVALID_USER_SESSION"
                });
            }

            // Verifica se a sessão permite renovação
            if (!sessionsData.remember) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão expirada",
                    code: "SESSION_EXPIRED"
                });
            }

            // Verifica limite absoluto da sessão
            const sessionIsExpired = new Date(sessionsData.expires_at) <= new Date();

            // Sessão expirada
            if (sessionIsExpired) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão expirada",
                    code: "EXPIRED_LIMIT_SESSION"
                });
            }

            // Refresh token
            const refresh_token = req.cookies.refresh_token;

            // Verifica refresh token
            if (!refresh_token) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão expirada",
                    code: "REFRESH_TOKEN_MISSING"
                });
            }

            // Compara refresh token
            const validRefreshToken = await bcrypt.compare(
                refresh_token, sessionsData.refresh_token_hash);

            // Refresh token inválido
            if (!validRefreshToken) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão expirada",
                    code: "REFRESH_TOKEN_INVALID"
                });
            }

            // Renova sessão no Supabase
            const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({ refresh_token });

            // Falha na renovação
            if (refreshError || !refreshData?.session || !refreshData?.user) {

                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Sessão expirada",
                    code: "REFRESH_TOKEN_ERROR_RENEW"
                });
            }

            // Novos tokens
            const newAccessToken = refreshData.session.access_token;
            const newRefreshToken = refreshData.session.refresh_token;

            // Novo hash do refresh token
            const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

            // Atualiza sessão
            const { data: updatedSession, error: updateSessionError } = await supabaseAdmin.from("sessions")
                .update({
                    refresh_token_hash: newRefreshTokenHash,
                    updated_at: new Date().toISOString()
                })
                .eq(
                    "session_id",
                    sessionId
                )
                .select("session_id")
                .maybeSingle();

            console.log("[REFRESH] Sessão atualizada:", updatedSession);
            console.log("[REFRESH] Erro ao atualizar:", updateSessionError);

            // Erro ao atualizar sessão
            if (updateSessionError) {

                return res.status(500).json({
                    success: false,
                    message: "Erro ao atualizar sessão, tente novamente.",
                    code: "SESSION_DATABASE_ERROR"
                });
            }

            const {
                data,
                error
            } = await supabaseAdmin
                .from("sessions")
                .update({
                    updated_at: new Date().toISOString()
                })
                .eq(
                    "session_id",
                    "d46381bf-e8c6-4c7b-a8c4-943c62cbfb0c"
                )
                .select("session_id")
                .maybeSingle();

            console.log("UPDATE TEST:", data);
            console.log("UPDATE ERROR:", error);

            // Atualiza cookies
            setSessionCookies(
                newAccessToken,
                newRefreshToken,
                true,
                res
            );

            // Dados do usuário
            req.user = {
                id: refreshData.user.id,
                sessionId,
                access_token: newAccessToken
            };

            if (req.originalUrl == "/user/check/token") {
                req.response = {
                    message: "Sessão renovada",
                    code: "SESSION_REFRESHED"
                }
            }

            return next();

        }

        // Claims do token válido
        const { claims } = claimsData;

        // Verifica Session ID
        if (!claims.session_id) {

            clearSessionCookies(res);

            return res.status(401).json({
                success: false,
                message: "Sessão inválida",
                code: "SESSION_ID_MISSING"
            });

        }


        // Tempo atual
        const now = Math.floor(Date.now() / 1000);


        // Verifica expiração
        if (!claims.exp || claims.exp <= now) {

            clearSessionCookies(res);

            return res.status(401).json({
                success: false,
                message: "Token expirado",
                code: "TOKEN_EXPIRED"
            });
        }

        // Token válido
        req.user = {
            id: claims.sub,
            sessionId: claims.session_id,
            access_token
        };


        return next();

    }

    catch (error) {

        console.error(
            "[controller_validaToken] Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor",
            code: "INTERNAL_SERVER_ERROR"
        });

    }

}