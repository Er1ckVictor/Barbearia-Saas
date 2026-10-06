import bcrypt from "bcrypt";

import { supabaseAdmin, supabaseClient } from "../../services/supabase/supabase.js";

import {
    clearSessionCookies,
    setSessionCookies
} from "../../middlewares/api/cookies.js";


// Quanto tempo uma instância "segura" a renovação antes de outra poder tentar (caso ela caia no meio)
const RENOVACAO_BLOQUEIO_MS = 15 * 1000;

// Quanto tempo depois de renovar o refresh token anterior ainda é aceito
// (requisições que já estavam a caminho com os cookies antigos)
const RENOVACAO_TOLERANCIA_MS = 10 * 1000;


// Libera a reserva da renovação (usado quando a renovação falha)
async function liberarRenovacao(sessionId) {

    const { error } = await supabaseAdmin
        .from("sessions")
        .update({ refreshing_until: null })
        .eq("session_id", sessionId);

    if (error) {
        console.error("[liberarRenovacao] Error:", error);
    }
}


// Faz a renovação de fato (só quem reservou a sessão chega aqui)
async function executarRenovacao({ sessionId, refresh_token, hashAtual }) {

    try {

        // Renova sessão no Supabase
        const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({ refresh_token });

        // Falha na renovação
        if (refreshError || !refreshData?.session || !refreshData?.user) {

            await liberarRenovacao(sessionId);

            return {
                resultado: "falha",
                status: 401,
                code: "REFRESH_TOKEN_ERROR_RENEW",
                message: "Sessão expirada"
            };
        }

        // Novos tokens
        const newAccessToken = refreshData.session.access_token;
        const newRefreshToken = refreshData.session.refresh_token;

        // Novo hash do refresh token
        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

        // Salva o novo hash, guarda o anterior e libera a reserva
        const { error: updateSessionError } = await supabaseAdmin.from("sessions")
            .update({
                refresh_token_hash: newRefreshTokenHash,
                previous_refresh_token_hash: hashAtual,
                refreshing_until: null,
                updated_at: new Date().toISOString()
            })
            .eq(
                "session_id",
                sessionId
            );

        // Erro ao atualizar sessão
        if (updateSessionError) {

            console.error("[executarRenovacao] Update session:", updateSessionError);

            await liberarRenovacao(sessionId);

            return {
                resultado: "falha",
                status: 500,
                code: "SESSION_DATABASE_ERROR",
                message: "Erro ao atualizar sessão, tente novamente."
            };
        }

        return {
            resultado: "renovada",
            userId: refreshData.user.id,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };

    }

    catch (error) {

        console.error("[executarRenovacao] Error:", error);

        await liberarRenovacao(sessionId);

        return {
            resultado: "falha",
            status: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro interno no servidor"
        };
    }
}


// Outra requisição ganhou a renovação (ou acabou de renovar): confere se este token é legítimo
async function verificarRenovacaoConcorrente({ sessionId, refresh_token, hashOriginal, atualConfereOriginal }) {

    // Relê a sessão, o hash pode ter mudado
    const { data: sessao, error } = await supabaseAdmin
        .from("sessions")
        .select("refresh_token_hash, previous_refresh_token_hash, refreshing_until, updated_at")
        .eq("session_id", sessionId)
        .maybeSingle();

    if (error) {

        console.error("[verificarRenovacaoConcorrente] Error:", error);

        return {
            resultado: "falha",
            status: 500,
            code: "SESSION_DATABASE_ERROR",
            message: "Erro ao consultar sessão"
        };
    }

    if (!sessao) {

        return {
            resultado: "falha",
            status: 401,
            code: "SESSION_NOT_FOUND",
            message: "Sessão não encontrada"
        };
    }

    const agora = Date.now();

    // O token ainda é o atual e outra requisição está renovando agora
    const atualConfere = sessao.refresh_token_hash === hashOriginal
        ? atualConfereOriginal
        : await bcrypt.compare(refresh_token, sessao.refresh_token_hash);

    if (atualConfere) {

        const reservaAtiva = sessao.refreshing_until && new Date(sessao.refreshing_until).getTime() > agora;

        if (reservaAtiva) {
            return { resultado: "em_andamento" };
        }

        // Reserva expirou no meio do caminho: pede para tentar de novo, sem derrubar a sessão
        return {
            resultado: "falha",
            status: 409,
            code: "SESSION_REFRESH_BUSY",
            message: "Não foi possível renovar a sessão agora, tente novamente."
        };
    }

    // O token é o anterior e a renovação aconteceu há pouco
    if (sessao.previous_refresh_token_hash && sessao.updated_at) {

        const renovadaHa = agora - new Date(sessao.updated_at).getTime();

        if (renovadaHa <= RENOVACAO_TOLERANCIA_MS) {

            const anteriorConfere = await bcrypt.compare(refresh_token, sessao.previous_refresh_token_hash);

            if (anteriorConfere) {
                return { resultado: "em_andamento" };
            }
        }
    }

    return {
        resultado: "falha",
        status: 401,
        code: "REFRESH_TOKEN_INVALID",
        message: "Sessão expirada"
    };
}


// Renova a sessão: o banco decide qual requisição (de qualquer instância) faz a renovação
async function renovarSessao({ sessionId, refresh_token, sessao }) {

    const hashAtual = sessao.refresh_token_hash;

    // Compara refresh token com o atual
    const atualConfere = await bcrypt.compare(refresh_token, hashAtual);

    if (atualConfere) {

        const agora = new Date();

        // Tenta reservar a renovação. O update só acontece se ninguém reservou e o hash não mudou,
        // então apenas uma requisição consegue, mesmo com várias instâncias.
        const { data: reservada, error: reservaError } = await supabaseAdmin
            .from("sessions")
            .update({
                refreshing_until: new Date(agora.getTime() + RENOVACAO_BLOQUEIO_MS).toISOString()
            })
            .eq("session_id", sessionId)
            .eq("refresh_token_hash", hashAtual)
            .or(`refreshing_until.is.null,refreshing_until.lt.${agora.toISOString()}`)
            .select("session_id");

        if (reservaError) {

            console.error("[renovarSessao] Reserva:", reservaError);

            return {
                resultado: "falha",
                status: 500,
                code: "SESSION_DATABASE_ERROR",
                message: "Erro ao atualizar sessão, tente novamente."
            };
        }

        // Ganhou a reserva: renova
        if (reservada && reservada.length > 0) {

            return executarRenovacao({ sessionId, refresh_token, hashAtual });
        }
    }

    // Não ganhou a reserva (ou o token não é o atual): vê se é uma renovação em andamento ou recém-feita
    return verificarRenovacaoConcorrente({
        sessionId,
        refresh_token,
        hashOriginal: hashAtual,
        atualConfereOriginal: atualConfere
    });
}


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

            // Renova a sessão (o banco decide quem renova quando há requisições simultâneas)
            const renovacao = await renovarSessao({
                sessionId,
                refresh_token,
                sessao: sessionsData
            });

            // Falha na renovação
            if (renovacao.resultado === "falha") {

                // Só limpa os cookies quando a sessão realmente não vale mais
                if (renovacao.status === 401) {
                    clearSessionCookies(res);
                }

                return res.status(renovacao.status).json({
                    success: false,
                    message: renovacao.message,
                    code: renovacao.code
                });
            }

            // Outra requisição está renovando (ou acabou de renovar) e vai enviar os cookies novos:
            // segue sem mexer nos cookies. O access token desta requisição ainda é o vencido.
            if (renovacao.resultado === "em_andamento") {

                req.user = {
                    id: claims.sub,
                    sessionId,
                    access_token
                };

                return next();
            }

            // Atualiza cookies (duram só o que resta do limite absoluto da sessão)
            setSessionCookies(
                renovacao.accessToken,
                renovacao.refreshToken,
                true,
                res,
                new Date(sessionsData.expires_at).getTime() - Date.now()
            );

            // Dados do usuário
            req.user = {
                id: renovacao.userId,
                sessionId,
                access_token: renovacao.accessToken
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