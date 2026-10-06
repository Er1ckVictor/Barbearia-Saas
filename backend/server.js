// Import's
import express from "express";
import dotenv from "dotenv"
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/auth/auth.routes.js";

// .ENV
dotenv.config({
    quiet: true
})

const app = express();

// === CORS ===
// Origens permitidas, separadas por vírgula no .env (ex: FRONTEND_URL=http://localhost:5173,https://meusite.com)
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {

        // Permite requisições sem origin (Postman, curl, servidor para servidor)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origem não permitida pelo CORS"));
    },
    credentials: true, // necessário para enviar/receber cookies httpOnly
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

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


// Origem bloqueada pelo CORS
app.use((err, req, res, next) => {

    if (err?.message === "Origem não permitida pelo CORS") {
        return res.status(403).json({
            success: false,
            message: err.message,
            code: "CORS_BLOCKED"
        })
    }

    return next(err)
})


// Inicialização
app.listen(3000, () => {
    console.log("Projeto rodando em http://localhost:3000")
})