const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { v4: uuid } = require("uuid");
const config = require("../config");

const execFileAsync = promisify(execFile);

function dimensionsFor(ratio) {
  if (ratio === "9:16") return { width: 720, height: 1280 };
  if (ratio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1280, height: 720 };
}

function escapeSrt(value) {
  return value.replace(/-->/g, "—>").replace(/\r/g, "").trim();
}

function toSrtTime(seconds) {
  const ms = Math.floor((seconds % 1) * 1000);
  const whole = Math.floor(seconds);
  const h = String(Math.floor(whole / 3600)).padStart(2, "0");
  const m = String(Math.floor((whole % 3600) / 60)).padStart(2, "0");
  const s = String(whole % 60).padStart(2, "0");
  return `${h}:${m}:${s},${String(ms).padStart(3, "0")}`;
}

async function runFfmpeg(args) {
  try {
    await execFileAsync(config.ffmpegPath, args, { timeout: 8 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("FFmpeg não foi encontrado. Instale o FFmpeg no servidor e confirme FFMPEG_PATH.");
    }
    const detail = (error.stderr || error.message || "").toString().slice(-1200);
    throw new Error(`Falha ao montar vídeo com FFmpeg: ${detail}`);
  }
}

async function createPhotoVideo({ images, music, captionText, aspectRatio, durationSeconds }) {
  const id = uuid();
  const { width, height } = dimensionsFor(aspectRatio);
  const perImage = durationSeconds / images.length;
  const segmentPaths = [];

  for (let index = 0; index < images.length; index += 1) {
    const segment = path.join(config.outputDir, `${id}-part-${index}.mp4`);
    const fadeOutStart = Math.max(0.5, perImage - 0.45);
    const filter = [
      `scale=${width}:${height}:force_original_aspect_ratio=increase`,
      `crop=${width}:${height}`,
      "setsar=1",
      "fade=t=in:st=0:d=0.4",
      `fade=t=out:st=${fadeOutStart}:d=0.4`,
      "format=yuv420p"
    ].join(",");

    await runFfmpeg([
      "-y", "-loop", "1", "-i", images[index].path,
      "-t", String(perImage),
      "-vf", filter,
      "-r", "24",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-pix_fmt", "yuv420p",
      "-an",
      segment
    ]);
    segmentPaths.push(segment);
  }

  const concatFile = path.join(config.outputDir, `${id}-concat.txt`);
  const silentVideo = path.join(config.outputDir, `${id}-silent.mp4`);
  const finalVideo = path.join(config.outputDir, `${id}.mp4`);

  const concatLines = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(concatFile, `${concatLines}\n`, "utf8");

  await runFfmpeg([
    "-y", "-f", "concat", "-safe", "0", "-i", concatFile,
    "-c", "copy", "-movflags", "+faststart",
    silentVideo
  ]);

  if (music) {
    await runFfmpeg([
      "-y", "-i", silentVideo,
      "-stream_loop", "-1", "-i", music.path,
      "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
      "-t", String(durationSeconds), "-shortest",
      "-movflags", "+faststart",
      finalVideo
    ]);
  } else {
    fs.renameSync(silentVideo, finalVideo);
  }

  let captionFile = null;
  if (captionText) {
    captionFile = `${id}.srt`;
    const cue = `1\n${toSrtTime(0)} --> ${toSrtTime(durationSeconds)}\n${escapeSrt(captionText)}\n`;
    fs.writeFileSync(path.join(config.outputDir, captionFile), cue, "utf8");
  }

  for (const file of [...segmentPaths, concatFile, silentVideo]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  return { videoFile: `${id}.mp4`, captionFile };
}

module.exports = { createPhotoVideo };
