
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const config = require("../config");

const execFileAsync = promisify(execFile);

function dimensionsFor(ratio) {
  const dimensions = {
    "9:16": { width: 720, height: 1280 },
    "16:9": { width: 1280, height: 720 },
    "1:1": { width: 1080, height: 1080 },
    "4:5": { width: 864, height: 1080 },
    "4:3": { width: 1080, height: 810 },
  };

  return dimensions[ratio] || dimensions["16:9"];
}

async function generateVideo({
  imagePath,
  outputPath,
  duration = 5,
  ratio = "16:9",
}) {
  if (!imagePath || !outputPath) {
    throw new Error("imagePath e outputPath são obrigatórios.");
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error("Imagem de origem não encontrada.");
  }

  const outputDir = path.dirname(outputPath);

  fs.mkdirSync(outputDir, { recursive: true });

  const { width, height } = dimensionsFor(ratio);

  const safeDuration = Math.max(
    1,
    Math.min(Number(duration) || 5, 60)
  );

  const ffmpegPath = config.ffmpegPath || "ffmpeg";

  const args = [
    "-y",
    "-loop", "1",
    "-i", imagePath,
    "-t", String(safeDuration),
    "-vf",
    `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`,
    "-r", "25",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outputPath,
  ];

  await execFileAsync(ffmpegPath, args);

  if (!fs.existsSync(outputPath)) {
    throw new Error("Não foi possível gerar o vídeo.");
  }

  return {
    success: true,
    outputPath,
    duration: safeDuration,
    width,
    height,
    format: "mp4",
  };
}

module.exports = {
  generateVideo,
  dimensionsFor,
};
