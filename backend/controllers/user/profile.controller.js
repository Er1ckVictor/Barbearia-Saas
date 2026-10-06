import {supabaseAdmin, supabaseClient} from "../../services/supabase/supabase.js"


// CPF com os 9 primeiros dígitos ocultos: ***.***.***-12
function cpfOculto(cpf) {

    return cpf && cpf.length === 11 ? `***.***.***-${cpf.slice(9)}` : null;
}

// Dados do perfil devolvidos ao front
function formatarPerfil(row) {

    return {
        name: row.name,
        email: row.email,
        phone: row.phone,
        cpf: cpfOculto(row.cpf)
    };
}


// Busca o perfil do usuário logado
export async function controller_perfilObter(req, res) {

    try {

        const { data, error } = await supabaseAdmin
            .from("users")
            .select("name, email, phone, cpf")
            .eq("id", req.user.id)
            .maybeSingle();

        if (error) {

            console.error("[controller_perfilObter] Error:", error);

            return res.status(500).json({
                success: false,
                message: "Erro ao consultar perfil",
                code: "USER_DATABASE_ERROR"
            });
        }

        if (!data) {

            return res.status(404).json({
                success: false,
                message: "Perfil não encontrado",
                code: "USER_NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            profile: formatarPerfil(data)
        });

    }

    catch (error) {

        console.error("[controller_perfilObter] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
}


// Atualiza nome e telefone do usuário logado
export async function controller_perfilAtualizar(req, res) {

    try {

        const { name, phone } = req.body ?? {};

        if (typeof name !== "string" || typeof phone !== "string") {

            return res.status(400).json({
                success: false,
                message: "Parâmetros obrigatórios ausentes",
                code: "PARAMETERS_REQUIRED"
            });
        }

        const cleanName = name.trim();
        const cleanPhone = phone.replace(/\D/g, "");

        if (cleanName.split(/\s+/).length < 2 || cleanName.length > 120) {

            return res.status(400).json({
                success: false,
                message: "Informe nome e sobrenome",
                code: "NAME_INVALID"
            });
        }

        if (cleanPhone.length < 10 || cleanPhone.length > 11) {

            return res.status(400).json({
                success: false,
                message: "Telefone inválido",
                code: "PHONE_INVALID"
            });
        }

        const { data, error } = await supabaseAdmin
            .from("users")
            .update({
                name: cleanName,
                phone: cleanPhone
            })
            .eq("id", req.user.id)
            .select("name, email, phone, cpf")
            .maybeSingle();

        if (error) {

            // Telefone já usado por outra conta (unique violation)
            if (error.code === "23505") {

                return res.status(409).json({
                    success: false,
                    message: "Telefone indisponível",
                    code: "PHONE_UNAVAILABLE"
                });
            }

            console.error("[controller_perfilAtualizar] Error:", error);

            return res.status(500).json({
                success: false,
                message: "Erro ao atualizar perfil",
                code: "USER_DATABASE_ERROR"
            });
        }

        if (!data) {

            return res.status(404).json({
                success: false,
                message: "Perfil não encontrado",
                code: "USER_NOT_FOUND"
            });
        }

        // Mantém o nome do Auth em sincronia (se falhar, o perfil já foi salvo)
        try {

            await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
                user_metadata: { name: cleanName }
            });

        } catch (metaError) {

            console.error("[controller_perfilAtualizar] Metadata:", metaError);
        }

        return res.status(200).json({
            success: true,
            message: "Dados atualizados com sucesso",
            profile: formatarPerfil(data)
        });

    }

    catch (error) {

        console.error("[controller_perfilAtualizar] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
}


// Altera a senha do usuário logado
export async function controller_senhaAlterar(req, res) {

    try {

        const { currentPassword, newPassword } = req.body ?? {};

        if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {

            return res.status(400).json({
                success: false,
                message: "Parâmetros obrigatórios ausentes",
                code: "PARAMETERS_REQUIRED"
            });
        }

        if (newPassword.length < 8 || newPassword.length > 72) {

            return res.status(400).json({
                success: false,
                message: "A nova senha deve ter entre 8 e 72 caracteres",
                code: "PASSWORD_INVALID"
            });
        }

        if (newPassword === currentPassword) {

            return res.status(400).json({
                success: false,
                message: "A nova senha deve ser diferente da atual",
                code: "PASSWORD_SAME"
            });
        }

        // Email do usuário
        const { data: userData, error: userError } = await supabaseAdmin
            .from("users")
            .select("email")
            .eq("id", req.user.id)
            .maybeSingle();

        if (userError || !userData?.email) {

            console.error("[controller_senhaAlterar] User:", userError);

            return res.status(500).json({
                success: false,
                message: "Erro ao consultar usuário",
                code: "USER_DATABASE_ERROR"
            });
        }

        // Confere a senha atual
        const { data: checkData, error: checkError } = await supabaseClient.auth.signInWithPassword({
            email: userData.email,
            password: currentPassword
        });

        if (checkError || !checkData?.session) {

            // 400 (e não 401) para o front não confundir com sessão expirada
            return res.status(400).json({
                success: false,
                message: "Senha atual incorreta",
                code: "CURRENT_PASSWORD_INVALID"
            });
        }

        // Encerra a sessão criada só para conferir a senha
        try {
            await supabaseAdmin.auth.admin.signOut(checkData.session.access_token, "local");
        } catch (signOutError) {
            console.error("[controller_senhaAlterar] SignOut check:", signOutError);
        }

        // Atualiza a senha
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
            password: newPassword
        });

        if (updateError) {

            console.error("[controller_senhaAlterar] Update:", updateError);

            return res.status(500).json({
                success: false,
                message: "Não foi possível alterar a senha",
                code: "PASSWORD_UPDATE_ERROR"
            });
        }

        // Encerra as outras sessões (outros dispositivos), mantendo a atual
        try {

            await supabaseAdmin.auth.admin.signOut(req.user.access_token, "others");

            await supabaseAdmin
                .from("sessions")
                .delete()
                .eq("user_id", req.user.id)
                .neq("session_id", req.user.sessionId);

        } catch (revokeError) {

            console.error("[controller_senhaAlterar] Revoke:", revokeError);
        }

        return res.status(200).json({
            success: true,
            message: "Senha alterada com sucesso",
            code: "PASSWORD_UPDATED"
        });

    }

    catch (error) {

        console.error("[controller_senhaAlterar] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
}
