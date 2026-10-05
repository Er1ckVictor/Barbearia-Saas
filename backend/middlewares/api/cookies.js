// Limpa cookies de sessão
export function clearSessionCookies(res) {
    const paramCookie = {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "lax"
    }

    res.clearCookie("access_token", { ...paramCookie, path: "/" })
    res.clearCookie("refresh_token", { ...paramCookie, path: "/user/check/token" })
}

// Adiciona cookies
export function setSessionCookies(access_token, refresh_token, remember, res) {

    // Dados do token
    const payloadData = JSON.parse(Buffer.from(access_token.split(".")[1], "base64url").toString())

    // Expiração do token
    const accessMaxAge = 60 * 60 * 1000//Math.max((payloadData.exp - Math.floor(Date.now() / 1000)) * 1000, 0)

    // Cookie de acesso
    res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "lax",
        maxAge: accessMaxAge,
        path: "/"
    })


    console.log("Access token:", accessMaxAge, "ms")
    console.log("Access token:", accessMaxAge / 1000, "segundos")
    console.log("Access token:", accessMaxAge / 60000, "minutos")

    // Remember?
    if (remember == false || !remember) return;

    // Duração do refresh_token
    const refreshDuration = 5 * 24 * 60 * 60 * 1000

    // Cookie de renovação do token
    res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "lax",
        maxAge: refreshDuration,
        path: "/user/check/token"
    })

}