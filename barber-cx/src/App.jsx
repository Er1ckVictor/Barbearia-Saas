// Css
import { Navigate, Route, Routes } from "react-router-dom"
import "./App.css"

import Content from "./components/Structure/Content/Content"
import Home from "./components/Pages/home/Home"

export default function App() {

  return (
    <Routes>

      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Content><Home /></Content>} />

    </Routes>
  )

}