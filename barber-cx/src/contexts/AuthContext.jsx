import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api.js"

// Cria contexto
const AuthContext = createContext();

// Auth context
export function AuthProvider({ children }) {

    // States
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    async function checkAuth() {

        try {
            await api.get("/user/check/token")
            setAuthenticated(true);
        }
        catch (error) {
            setAuthenticated(false);
        }
        finally {
            setLoading(false);
        }
    }

    function logout() {
        setAuthenticated(false);
    }

    useEffect(() => {

        checkAuth();

    }, [])

    return (
        <AuthContext.Provider
            value={{
                authenticated,
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