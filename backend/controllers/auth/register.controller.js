import { supabaseAdmin } from "../../services/supabase/supabase.js";

// Valida CPF pelos dígitos verificadores
function cpfValido(cpf) {

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const digito = (base) => {

        let soma = 0;

        for (let i = 0; i < base; i++) {
            soma += Number(cpf[i]) * (base + 1 - i);
        }

        const resto = (soma * 10) % 11;

        return resto === 10 ? 0 : resto;
    };

    return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}


// Cadastro do cliente
export async function controller_usuarioRegistro(req, res) {

    try {

        // Dados recebidos
        const { name, email, phone, cpf, password } = req.body ?? {};

        // Valida campos obrigatórios
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof cpf !== "string" ||
            typeof password !== "string" ||
            !name || !email || !phone || !cpf || !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Parâmetros obrigatórios ausentes",
                code: "PARAMETERS_REQUIRED"
            });
        }

        // Normaliza os dados
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.replace(/\D/g, "");
        const cleanCpf = cpf.replace(/\D/g, "");

        // Valida nome
        if (cleanName.split(/\s+/).length < 2 || cleanName.length > 120) {

            return res.status(400).json({
                success: false,
                message: "Informe nome e sobrenome",
                code: "NAME_INVALID"
            });
        }

        // Valida email
        if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {

            return res.status(400).json({
                success: false,
                message: "Email inválido",
                code: "EMAIL_INVALID"
            });
        }

        // Valida telefone
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {

            return res.status(400).json({
                success: false,
                message: "Telefone inválido",
                code: "PHONE_INVALID"
            });
        }

        // Valida CPF
        if (!cpfValido(cleanCpf)) {

            return res.status(400).json({
                success: false,
                message: "CPF inválido",
                code: "CPF_INVALID"
            });
        }

        // Valida senha
        if (password.length < 8 || password.length > 72) {

            return res.status(400).json({
                success: false,
                message: "A senha deve ter entre 8 e 72 caracteres",
                code: "PASSWORD_INVALID"
            });
        }


        // Cria usuário no Supabase Auth
        const {
            data: authData,
            error: authError
        } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: { name: cleanName }
        });

        // Erro ao criar usuário
        if (authError || !authData?.user) {

            // Email já cadastrado
            if (authError?.code === "email_exists") {

                return res.status(409).json({
                    success: false,
                    message: "Email, telefone ou CPF já cadastrado",
                    code: "USER_ALREADY_EXISTS"
                });
            }

            console.error("[controller_usuarioRegistro] Auth:", authError);

            return res.status(500).json({
                success: false,
                message: "Não foi possível criar a conta",
                code: "USER_CREATE_ERROR"
            });
        }

        const userId = authData.user.id;


        // Cria o perfil na tabela users
        const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
                id: userId,
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                cpf: cleanCpf
            });

        // Erro ao criar perfil
        if (insertError) {

            // Desfaz a criação no Auth para não deixar usuário órfão
            await supabaseAdmin.auth.admin.deleteUser(userId);

            // Telefone ou CPF duplicado (unique violation)
            if (insertError.code === "23505") {

                return res.status(409).json({
                    success: false,
                    message: "Email, telefone ou CPF já cadastrado",
                    code: "USER_ALREADY_EXISTS"
                });
            }

            console.error("[controller_usuarioRegistro] Insert:", insertError);

            return res.status(500).json({
                success: false,
                message: "Não foi possível criar a conta",
                code: "USER_DATABASE_ERROR"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Conta criada com sucesso",
            code: "USER_CREATED"
        });

    }

    catch (error) {

        console.error("[controller_usuarioRegistro] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
}
