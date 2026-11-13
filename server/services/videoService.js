
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const config = require("../config");
const { createOutputPath } = require("./fileService");

const execFileAsync = promisify(execFile);

function dimensionsFor(ratio) {
  const dimensions = {
    "9:16": { width: 720, height: 1280 },
    "16:9": { width: 1280, height: 720 },
    "1:1": { width: 1080, height: 1080 }
  };

  return dimensions[ratio] || dimensions["16:9"];
}

async function generateVideo({
  imagePath,
  outputPath,
  duration = 5,
  ratio = "16:9"
}) {
  if (!imagePath || !outputPath) {
    throw new Error("Imagem e caminho de saída são obrigatórios.");
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error("Imagem de origem não encontrada.");
  }

  const { width, height } = dimensionsFor(ratio);

  const safeDuration = Math.max(
    1,
    Math.min(Number(duration) || 5, 60)
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const args = [
    "-y",
    "-loop", "1",
    "-i", imagePath,
    "-t", String(safeDuration),
    "-vf",
    `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},format=yuv420p`,
    "-r", "25",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outputPath
  ];

  await execFileAsync(config.ffmpegPath || "ffmpeg", args);

  if (!fs.existsSync(outputPath)) {
    throw new Error("Não foi possível gerar o vídeo.");
  }

  return {
    success: true,
    outputPath,
    duration: safeDuration,
    width,
    height,
    format: "mp4"
  };
}

async function createPhotoVideo({
  images,
  music = null,
  prompt = "",
  captionText = "",
  aspectRatio = "16:9",
  durationSeconds = 12
}) {
  if (!Array.isArray(images) || images.length < 3 || images.length > 5) {
    throw new Error("O vídeo precisa de 3 a 5 fotografias.");
  }

  for (const image of images) {
    if (!image.path || !fs.existsSync(image.path)) {
      throw new Error("Uma das fotografias não foi encontrada.");
    }
  }

  const allowedDurations = [12, 15, 20, 30];

  if (!allowedDurations.includes(Number(durationSeconds))) {
    throw new Error("Duração do vídeo inválida.");
  }

  if (music && !fs.existsSync(music.path)) {
    throw new Error("Ficheiro de música não encontrado.");
  }

  const { width, height } = dimensionsFor(aspectRatio);
  const duration = Number(durationSeconds);
  const secondsPerImage = duration / images.length;

  const outputPath = createOutputPath("mp4");

  const args = ["-y"];

  for (const image of images) {
    args.push(
      "-loop", "1",
      "-t", String(secondsPerImage),
      "-i", image.path
    );
  }

  let musicInputIndex = -1;

  if (music) {
    musicInputIndex = images.length;
    args.push("-stream_loop", "-1", "-i", music.path);
  }

  const filters = [];

  images.forEach((_image, index) => {
    filters.push(
      `[${index}:v]` +
      `scale=${width}:${height}:force_original_aspect_ratio=increase,` +
      `crop=${width}:${height},` +
      `setsar=1,fps=25,format=yuv420p,` +
      `trim=duration=${secondsPerImage},` +
      `setpts=PTS-STARTPTS[v${index}]`
    );
  });

  const videoInputs = images
    .map((_image, index) => `[v${index}]`)
    .join("");

  filters.push(
    `${videoInputs}concat=n=${images.length}:v=1:a=0[outv]`
  );

  args.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[outv]"
  );

  if (music) {
    args.push(
      "-map",
      `${musicInputIndex}:a:0`,
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-af",
      "volume=0.85",
      "-shortest"
    );
  } else {
    args.push("-an");
  }

  args.push(
    "-t",
    String(duration),
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "25",
    "-movflags",
    "+faststart",
    outputPath
  );

  await execFileAsync(config.ffmpegPath || "ffmpeg", args);

  if (!fs.existsSync(outputPath)) {
    throw new Error("O FFmpeg não conseguiu criar o vídeo.");
  }

  return {
    videoFile: path.basename(outputPath),
    captionFile: null,
    durationSeconds: duration,
    aspectRatio,
    width,
    height,
    engine: "FFmpeg",
    promptUsed: Boolean(prompt),
    captionsRequested: Boolean(captionText)
  };
}

module.exports = {
  generateVideo,
  createPhotoVideo,
  dimensionsFor
};
