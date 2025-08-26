import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";
import { getSupabaseClient } from "./src/services/whatsappService.js";
import cookieParser from "cookie-parser";
import { startWorker } from "./utils/processScheduledMessages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const frontendURL = process.env.FRONTEND_URL || "*";

const allowedOrigins = frontendURL.split(",");

console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "cookie"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("Servidor OK! 🎉");
});

app.get("/dbtest", async (req, res) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from("evolution").select("*").limit(1);

  if (error) {
    console.error("Erro ao conectar ao banco: ", error.message);
    res.json({ error: error.message });
  } else {
    console.log("Conexão com o banco OK: ", data);
    res.json({ message: "Conexão com o banco OK: " });
  }
});
app.use("/auth", authRoutes);

app.use("/api", apiRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(port, "0.0.0.0", () => {
  startWorker();
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Memória inicial: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

setInterval(() => {
  const mem = process.memoryUsage();
  const used = Math.round(mem.heapUsed / 1024 / 1024);
  const total = Math.round(mem.heapTotal / 1024 / 1024);
  if (used > 500) console.warn(`⚠️ Memória alta: ${used}MB / ${total}MB`);
}, 5 * 60 * 1000);

process.on("uncaughtException", (err) => console.error("❌ Erro não tratado:", err));
process.on("unhandledRejection", (reason, promise) => console.error("❌ Promessa rejeitada não tratada:", reason));
