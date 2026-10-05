import bcrypt from "bcrypt";

const sessions = new Map();

const CACHE_TTL = 80 * 60 * 1000; // 1h20m


// CRIA / ATUALIZA SESSÃO
export function setCacheSession(
    sessionId,
    userId,
    refreshTokenHash,
    persistent
) {
    sessions.set(sessionId, {
        userId,
        sessionId,
        refreshTokenHash,
        persistent,
        expiresAt: Date.now() + CACHE_TTL
    });
}


// BUSCA SESSÃO PELO SESSION ID
export function getCacheSession(sessionId) {

    const session = sessions.get(sessionId);

    if (!session) {
        return null;
    }

    // Verifica expiração
    if (session.expiresAt <= Date.now()) {

        sessions.delete(sessionId);

        return null;
    }

    return session;
}


// BUSCA SESSÃO PELO REFRESH TOKEN
export async function findCacheSessionByRefreshToken(
    refreshToken
) {

    // Não existe refresh token
    if (!refreshToken) {
        return null;
    }

    const now = Date.now();

    for (const [
        sessionId,
        session
    ] of sessions.entries()) {

        // REMOVE SESSÕES EXPIRADAS
        if (session.expiresAt <= now) {

            sessions.delete(sessionId);

            continue;
        }


        // COMPARA REFRESH TOKEN
        const isValid = await bcrypt.compare(
            refreshToken,
            session.refreshTokenHash
        );

        // REFRESH TOKEN ENCONTRADO
        if (isValid) {

            return {
                sessionId,
                userId: session.userId,
                session
            };
        }
    }


    // Nenhuma sessão corresponde ao refresh token
    return null;
}


// REMOVE SESSÃO
export function deleteCacheSession(sessionId) {

    sessions.delete(sessionId);
}