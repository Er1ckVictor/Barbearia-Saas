export async function usuarioLogin(req, res) {

    // Verifica body
    if (!req.body) {
        return res.status(404).json({
            success: false,
            message: "Body is required",
            code: "BODY_REQUIRED"
        })
    }

    // Parametros
    const { email, password, session } = req.body;

    // Verifica parametros
    if (!email || !password || !session) {

        let errors = []
        !email ? errors.push("email") : ""
        !password ? errors.push("password") : ""
        !session ? errors.push("session") : ""

        return res.status(404).json({
            success: false,
            message: "Missing parameters",
            code: "MISSING_PARAMETERS",
            fields: errors
        })
    }

}

const body = 
{
    intervalo_minuto: "15 minutos",
    rate_limit: 5,
    considerar_login_com_sucesso: true,
    verificoes: "email e ip do usuário",
    mensagem_retorno: "Excesso de requisições. Tente novamente mais tarde."
}