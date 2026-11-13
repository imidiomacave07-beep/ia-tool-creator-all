
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");

const config = require("../config");
const { createPhotoVideo } = require("../services/videoService");
const { ensureDirectory } = require("../services/fileService");

const router = express.Router();

const allowedImages = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const allowedAudio = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/x-m4a"
]);

ensureDirectory(config.uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
      .toLowerCase()
      .slice(0, 10);

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
    const valid =
      file.fieldname === "images"
        ? allowedImages.has(file.mimetype)
        : file.fieldname === "music" &&
          allowedAudio.has(file.mimetype);

    if (!valid) {
      return cb(
        new Error("Formato de ficheiro não suportado.")
      );
    }

    cb(null, true);
  }
});

function removeUploadedFiles(files) {
  if (!files) return;

  for (const group of Object.values(files)) {
    for (const file of group) {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error(
            "Não foi possível remover ficheiro temporário:",
            error.message
          );
        }
      }
    }
  }
}

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "music", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const {
        mode,
        prompt = "",
        captionText = "",
        aspectRatio = "16:9",
        durationSeconds = "12"
      } = req.body;

      const cleanPrompt = String(prompt).trim();

      if (!cleanPrompt) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          error: "A descrição do vídeo é obrigatória."
        });
      }

      if (mode === "text-to-video") {
        removeUploadedFiles(req.files);

        return res.status(501).json({
          ok: false,
          error:
            "A geração de vídeo por texto ainda não está disponível. " +
            "A integração com um fornecedor será activada após configurar " +
            "o pagamento e o sistema de créditos."
        });
      }

      if (mode !== "images-to-video") {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          error: "Modo de criação inválido."
        });
      }

      const images = req.files?.images || [];

      if (images.length < 3 || images.length > 5) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          error: "Envie entre 3 e 5 fotografias."
        });
      }

      const validRatios = new Set([
        "16:9",
        "9:16",
        "1:1"
      ]);

      if (!validRatios.has(aspectRatio)) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          error: "Formato de vídeo inválido."
        });
      }

      const duration = Number(durationSeconds);

      if (![12, 15, 20, 30].includes(duration)) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          error: "Duração inválida."
        });
      }

      const music = req.files?.music?.[0] || null;

      const output = await createPhotoVideo({
        images,
        music,
        prompt: cleanPrompt,
        captionText: String(captionText).trim(),
        aspectRatio,
        durationSeconds: duration
      });

      removeUploadedFiles(req.files);

      return res.status(201).json({
        ok: true,
        message: "Vídeo criado com sucesso.",
        videoUrl: `/outputs/${output.videoFile}`,
        captionsUrl: output.captionFile
          ? `/outputs/${output.captionFile}`
          : null,
        durationSeconds: duration,
        aspectRatio,
        engine: "FFmpeg"
      });

    } catch (error) {
      removeUploadedFiles(req.files);
      next(error);
    }
  }
);

module.exports = router;
