
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const config = require("./config");
const generationRoutes = require("./routes/generation");

const app = express();

// Criar automaticamente as pastas necessárias
fs.mkdirSync(config.uploadDir, { recursive: true });
fs.mkdirSync(config.outputDir, { recursive: true });

// Segurança HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Configuração CORS
const allowedOrigins = config.clientOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  methods: ["GET", "POST"]
}));

app.use(express.json({ limit: "1mb" }));

// Disponibilizar vídeos gerados
app.use("/outputs", express.static(config.outputDir, {
  setHeaders(res) {
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
}));

// Verificar estado da API
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "global-view-ai-creator",
    version: "0.1.0"
  });
});

// Informações sobre os fornecedores
app.get("/api/providers", (_req, res) => {
  res.json({
    photoToVideo: {
      available: true,
      engine: "FFmpeg"
    },
    textToVideo: {
      available: false,
      note: "Fornecedor de IA ainda não configurado."
    },
    automaticSpeechCaptions: {
      available: false,
      note: "Fornecedor de reconhecimento de voz ainda não configurado."
    }
  });
});

// Limitar pedidos de geração
app.use(
  "/api/generate",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 8,
    standardHeaders: "draft-7",
    legacyHeaders: false
  }),
  generationRoutes
);

// Tratamento de erros
app.use((err, _req, res, _next) => {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: `Um ficheiro excede o limite de ${config.maxUploadMb} MB.`
    });
  }

  if (
    err.code === "LIMIT_FILE_COUNT" ||
    err.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    return res.status(400).json({
      error: "Número ou tipo de ficheiros não permitido."
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor."
  });
});

// Iniciar servidor
const PORT = Number(process.env.PORT || config.port);

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Global View AI Creator API running on port ${PORT}`
  );
});
