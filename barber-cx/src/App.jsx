// Css
import { Route, Routes } from "react-router-dom"
import "./App.css"

import Content from "./components/Structure/Content/Content"
import Login from "./components/Pages/login/Login"

export default function App() {

  return (
    <Routes>

      <Route path="/login" element={<Login/>} />
      <Route path="/dashboard" element={<Content></Content>} />
      <Route path="/barbeiros" element={<Content><h1>teste</h1></Content>} />

    </Routes>
  )

}