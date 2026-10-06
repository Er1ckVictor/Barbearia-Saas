import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api.js"

// Cria contexto
const AuthContext = createContext();

// Auth context
export function AuthProvider({ children }) {

    // States
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verifica a sessão e carrega os dados do usuário
    async function checkAuth() {

        try {
            const { data } = await api.get("/user/check/token")
            setUser(data.user ?? null);
            setAuthenticated(true);
        }
        catch (error) {
            setUser(null);
            setAuthenticated(false);
        }
        finally {
            setLoading(false);
        }
    }

    // Encerra a sessão no backend e limpa o estado local
    async function logout() {

        try {
            await api.post("/user/logout")
        }
        catch (error) {
            console.error("Erro ao encerrar sessão:", error)
        }
        finally {
            setUser(null);
            setAuthenticated(false);
        }
    }

    useEffect(() => {

        checkAuth();

    }, [])

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                loading,
                checkAuth,
                logout
            }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {

    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth deve ser usado dentro do AuthProvider")
    }

    return context
}
