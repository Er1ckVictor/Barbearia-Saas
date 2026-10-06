import bcrypt from "bcrypt";

import { supabaseAdmin, supabaseClient } from "../../services/supabase/supabase.js";

import {
    clearSessionCookies,
    setSessionCookies
} from "../../middlewares/api/cookies.js";


// Login do usuário (por email ou telefone)
export async function controller_usuarioLogin(req, res) {
    try {

        // Valida body
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Body é obrigatório",
                code: "BODY_REQUIRED"
            });
        }

        // Dados recebidos
        const { email, phone, password, remember } = req.body;

        // Valida campos
        if (
            (!email && !phone) ||
            typeof password !== "string" ||
            !password ||
            typeof remember !== "boolean"
        ) {
            clearSessionCookies(res);

            return res.status(400).json({
                success: false,
                message: "Parâmetros obrigatórios ausentes",
                code: "PARAMETERS_REQUIRED"
            });
        }

        // Email que será usado na autenticação
        let loginEmail = null;

        if (email) {

            if (typeof email !== "string") {
                clearSessionCookies(res);

                return res.status(400).json({
                    success: false,
                    message: "Parâmetros obrigatórios ausentes",
                    code: "PARAMETERS_REQUIRED"
                });
            }

            loginEmail = email.trim().toLowerCase();

        } else {

            // Login por telefone: busca o email na tabela users
            const cleanPhone = String(phone).replace(/\D/g, "");

            if (cleanPhone.length < 10 || cleanPhone.length > 11) {
                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Email ou senha inválidos",
                    code: "INVALID_CREDENTIALS"
                });
            }

            const {
                data: phoneUser,
                error: phoneError
            } = await supabaseAdmin
                .from("users")
                .select("email")
                .eq("phone", cleanPhone)
                .maybeSingle();

            if (phoneError) {
                console.error(phoneError);

                clearSessionCookies(res);

                return res.status(500).json({
                    success: false,
                    message: "Erro ao consultar usuário",
                    code: "USER_DATABASE_ERROR"
                });
            }

            // Mesma resposta de credenciais inválidas para não revelar se o telefone existe
            if (!phoneUser?.email) {
                clearSessionCookies(res);

                return res.status(401).json({
                    success: false,
                    message: "Email ou senha inválidos",
                    code: "INVALID_CREDENTIALS"
                });
            }

            loginEmail = phoneUser.email;
        }

        // Autentica usuário
        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: loginEmail,
            password
        });


        // Credenciais inválidas

        if (
            error ||
            !data?.user ||
            !data?.session
        ) {
            clearSessionCookies(res);

            return res.status(401).json({
                success: false,
                message: "Email ou senha inválidos",
                code: "INVALID_CREDENTIALS"
            });
        }


        // Dados da sessão

        const userId =
            data.user.id;

        const accessToken =
            data.session.access_token;

        const refreshToken =
            data.session.refresh_token;


        // Valida access token
        const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(accessToken);

        if (claimsError || !claimsData?.claims) {
            clearSessionCookies(res);

            return res.status(401).json({
                success: false,
                message: "Não foi possível validar a sessão",
                code: "SESSION_VALIDATION_ERROR"
            });
        }


        // Session ID
        const sessionId = claimsData.claims.session_id;

        if (!sessionId) {
            clearSessionCookies(res);

            return res.status(401).json({
                success: false,
                message: "Sessão inválida",
                code: "SESSION_ID_MISSING"
            });
        }

        // Busca limite de sessões
        const {
            data: userData,
            error: userError
        } = await supabaseAdmin
            .from("users")
            .select("max_sessions")
            .eq("id", userId)
            .single();

        if (userError) {
            console.error(userError);

            clearSessionCookies(res);

            return res.status(500).json({
                success: false,
                message: "Erro ao consultar usuário",
                code: "USER_DATABASE_ERROR"
            });
        }


        const maxSessions =
            userData.max_sessions;


        // Busca sessões ativas

        const {
            data: sessions,
            error: sessionsError
        } = await supabaseAdmin
            .from("sessions")
            .select(
                "id, session_id, expires_at"
            )
            .eq("user_id", userId)
            .gt(
                "expires_at",
                new Date().toISOString()
            )
            .order(
                "expires_at",
                {
                    ascending: true
                }
            );


        if (sessionsError) {
            console.error(sessionsError);

            clearSessionCookies(res);

            return res.status(500).json({
                success: false,
                message: "Erro ao consultar sessões",
                code: "SESSION_DATABASE_ERROR"
            });
        }


        // Verifica limite de sessões

        if (sessions.length >= maxSessions) {

            // Sessão que vence primeiro

            const sessionToReplace =
                sessions[0];


            // Remove sessão

            const {
                error: deleteError
            } = await supabaseAdmin
                .from("sessions")
                .delete()
                .eq(
                    "session_id",
                    sessionToReplace.session_id
                );


            if (deleteError) {
                console.error(deleteError);

                clearSessionCookies(res);

                return res.status(500).json({
                    success: false,
                    message: "Não foi possível substituir a sessão",
                    code: "SESSION_REPLACE_ERROR"
                });
            }
        }


        // Define expiração da sessão

        let expiresAt;

        if (remember) {

            expiresAt = new Date();

            expiresAt.setDate(
                expiresAt.getDate() + 5
            );

        } else {

            expiresAt =
                new Date(
                    claimsData.claims.exp * 1000
                );
        }


        // Hash do refresh token

        const refreshTokenHash =
            await bcrypt.hash(
                refreshToken,
                12
            );


        // Cria nova sessão
        const { error: insertError } = await supabaseAdmin
            .from("sessions")
            .insert({
                user_id: userId,
                session_id: sessionId,
                refresh_token_hash: refreshTokenHash,
                remember,
                expires_at: expiresAt.toISOString()
            });


        if (insertError) {
            console.error(insertError);

            clearSessionCookies(res);

            return res.status(500).json({
                success: false,
                message: "Não foi possível criar a sessão",
                code: "SESSION_CREATE_ERROR"
            });
        }


        // Define cookies
        setSessionCookies(
            accessToken,
            refreshToken,
            remember,
            res
        );


        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso",
            userId
        });

    } catch (error) {

        console.error(error);

        clearSessionCookies(res);

        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
}
