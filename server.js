require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const generationRoutes = require("./routes/generation");

fs.mkdirSync(config.uploadDir, { recursive: true });
fs.mkdirSync(config.outputDir, { recursive: true });

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: config.clientOrigin === "*" ? true : config.clientOrigin.split(",").map((v) => v.trim()),
  methods: ["GET", "POST"]
}));
app.use(express.json({ limit: "1mb" }));
app.use("/outputs", express.static(config.outputDir, {
  setHeaders(res) {
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
}));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "global-view-ai-creator", version: "0.1.0" });
});

app.get("/api/providers", (_req, res) => {
  res.json({
    photoToVideo: { available: true, engine: "FFmpeg slideshow renderer" },
    textToVideo: {
      available: false,
      provider: process.env.TEXT_TO_VIDEO_PROVIDER || "none",
      note: "Connect an approved provider adapter and server-side API key."
    },
    automaticSpeechCaptions: { available: false, note: "Requires a speech-to-text provider." }
  });
});

app.use("/api/generate", rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false
}), generationRoutes);

const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/outputs/")) {
      return res.sendFile(path.join(clientDist, "index.html"));
    }
    next();
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: `Um ficheiro excede o limite de ${config.maxUploadMb} MB.` });
  }
  if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ error: "Número ou tipo de ficheiros não permitido." });
  }
  res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor." });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Global View AI Creator API running on port ${config.port}`);
});
