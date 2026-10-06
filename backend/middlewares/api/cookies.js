// Duração padrão da sessão "lembrar de mim"
const REMEMBER_DURATION = 5 * 24 * 60 * 60 * 1000;

// O refresh token vai em todas as rotas /user, assim qualquer rota protegida consegue renovar a sessão
const REFRESH_COOKIE_PATH = "/user";

// Caminho usado antes desta versão, mantido só para limpar cookies antigos do navegador
const LEGACY_REFRESH_COOKIE_PATH = "/user/check/token";

// Opções comuns dos cookies
function baseOptions() {

    return {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "lax"
    };
}

// Limpa cookies de sessão
export function clearSessionCookies(res) {

    const base = baseOptions();

    res.clearCookie("access_token", { ...base, path: "/" });
    res.clearCookie("refresh_token", { ...base, path: REFRESH_COOKIE_PATH });
    res.clearCookie("refresh_token", { ...base, path: LEGACY_REFRESH_COOKIE_PATH });
}

// Adiciona cookies
// maxAgeMs: duração dos cookies quando "remember" está ativo (padrão 5 dias, ou o tempo que resta da sessão)
export function setSessionCookies(access_token, refresh_token, remember, res, maxAgeMs = REMEMBER_DURATION) {

    const base = baseOptions();

    // Sem "lembrar": o cookie de acesso dura só até o token expirar e não há refresh token
    if (!remember) {

        const payload = JSON.parse(Buffer.from(access_token.split(".")[1], "base64url").toString());

        const accessMaxAge = Math.max(payload.exp * 1000 - Date.now(), 1000);

        res.cookie("access_token", access_token, {
            ...base,
            maxAge: accessMaxAge,
            path: "/"
        });

        // Remove refresh token de logins anteriores
        res.clearCookie("refresh_token", { ...base, path: REFRESH_COOKIE_PATH });
        res.clearCookie("refresh_token", { ...base, path: LEGACY_REFRESH_COOKIE_PATH });

        return;
    }

    // Com "lembrar": os dois cookies duram o mesmo tempo, assim o servidor ainda recebe
    // o token expirado e consegue renová-lo com o refresh token
    const duration = Math.max(maxAgeMs, 1000);

    res.cookie("access_token", access_token, {
        ...base,
        maxAge: duration,
        path: "/"
    });

    res.cookie("refresh_token", refresh_token, {
        ...base,
        maxAge: duration,
        path: REFRESH_COOKIE_PATH
    });

}