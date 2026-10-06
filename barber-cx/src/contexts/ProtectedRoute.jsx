import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

function ProtectedRoute() {

    const { authenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Carregando...</div>

    // Guarda a página pedida para voltar a ela depois do login
    if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />

    return <Outlet />
}

export default ProtectedRoute;
