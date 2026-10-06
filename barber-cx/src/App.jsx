// Css
import { Navigate, Route, Routes } from "react-router-dom"
import "./App.css"

import Content from "./components/Structure/Content/Content"
import Home from "./components/Pages/Home/Home"
import Login from "./components/Pages/login/Login"
import Register from "./components/Pages/register/Register"
import MyAccount from "./components/Pages/account/MyAccount"
import ProtectedRoute from "./contexts/ProtectedRoute"

export default function App() {

  return (
    <Routes>

      <Route path="*" element={<Navigate to="/home" replace />} />

      {/* Páginas com Sidebar */}
      <Route path="/home" element={<Content><Home /></Content>} />

      {/* Páginas que exigem login: quem não estiver logado vai para /login e volta depois */}
      <Route element={<ProtectedRoute />}>
        <Route path="/my-account" element={<Content><MyAccount /></Content>} />
      </Route>

      {/* Páginas de autenticação, sem Content para não exibir a Sidebar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

    </Routes>
  )

}
