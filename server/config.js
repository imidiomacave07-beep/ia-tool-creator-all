
const path = require("path");

const serverRoot = __dirname;

module.exports = {
  port: Number(process.env.PORT || 3001),

  clientOrigin:
    process.env.CLIENT_ORIGIN || "http://localhost:5173",

  ffmpegPath:
    process.env.FFMPEG_PATH || "ffmpeg",

  maxUploadMb:
    Number(process.env.MAX_UPLOAD_MB || 15),

  uploadDir:
    path.join(serverRoot, "uploads"),

  outputDir:
    path.join(serverRoot, "outputs")
};
