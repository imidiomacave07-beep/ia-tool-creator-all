const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuid } = require("uuid");
const config = require("../config");
const { createPhotoVideo } = require("../services/videoService");
const { generateFromText } = require("../services/providers/textToVideoProvider");

const router = express.Router();
const allowedImages = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedAudio = new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/aac", "audio/x-m4a"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadMb * 1024 * 1024,
    files: 6
  },
  fileFilter: (_req, file, cb) => {
    const valid = file.fieldname === "images"
      ? allowedImages.has(file.mimetype)
      : file.fieldname === "music" && allowedAudio.has(file.mimetype);
    cb(valid ? null : new Error("Formato de ficheiro não suportado."), valid);
  }
});

router.post("/", upload.fields([
  { name: "images", maxCount: 5 },
  { name: "music", maxCount: 1 }
]), async (req, res, next) => {
  try {
    const {
      mode,
      prompt = "",
      captionText = "",
      aspectRatio = "16:9",
      durationSeconds = "12"
    } = req.body;

    if (!String(prompt).trim()) {
      return res.status(400).json({ error: "A descrição do vídeo é obrigatória." });
    }

    if (mode === "text-to-video") {
      const generated = await generateFromText({ prompt: String(prompt).trim() });
      return res.json(generated);
    }

    if (mode !== "images-to-video") {
      return res.status(400).json({ error: "Modo de criação inválido." });
    }

    const images = req.files?.images || [];
    if (images.length < 3 || images.length > 5) {
      return res.status(400).json({ error: "Envie entre 3 e 5 fotografias." });
    }

    const ratios = new Set(["16:9", "9:16", "1:1"]);
    if (!ratios.has(aspectRatio)) {
      return res.status(400).json({ error: "Formato de vídeo inválido." });
    }

    const duration = Number(durationSeconds);
    if (![12, 15, 20, 30].includes(duration)) {
      return res.status(400).json({ error: "Duração inválida." });
    }

    const music = req.files?.music?.[0] || null;
    const output = await createPhotoVideo({
      images,
      music,
      prompt: String(prompt).trim(),
      captionText: String(captionText || "").trim(),
      aspectRatio,
      durationSeconds: duration
    });

    res.status(201).json({
      ok: true,
      message: "Montagem criada a partir das fotografias enviadas.",
      videoUrl: `/outputs/${output.videoFile}`,
      captionsUrl: output.captionFile ? `/outputs/${output.captionFile}` : null,
      durationSeconds: duration,
      aspectRatio,
      engine: "FFmpeg"
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
