// Import's
import express from "express";
import dotenv from "dotenv"

// .ENV
dotenv.config({
    quiet: true
})

const app = express()
app.use(express.json());

// === ROTAS DE API ===
app.get("/", (req, res) => {

    return res.json({
        success: true,
        message: "API inicializada"
    })

})

// Inicialização
app.listen(3000, () => {
    console.log("Projeto rodando em http://localhost:3000")
})