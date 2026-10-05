// Import's
import express from "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/auth/auth.routes.js";
import { authRateLimit } from "./middlewares/api/rateLimit.js";

// .ENV
dotenv.config({
    quiet: true
})

const app = express();
app.use(express.json());
app.use(cookieParser());

// === ROTAS DE API ===
app.get("/", (req, res) => {

    return res.json({
        success: true,
        message: "API inicializada"
    })

})

// === Autenticação ===
app.use("/user", authRoutes)


// Inicialização
app.listen(3000, () => {
    console.log("Projeto rodando em http://localhost:3000")
})