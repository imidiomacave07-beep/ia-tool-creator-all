
const fs = require("fs");
const path = require("path");
const config = require("../config");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function getOutputDirectory() {
  return ensureDirectory(
    config.outputDir || path.join(__dirname, "../../outputs")
  );
}

function createOutputPath(extension = "mp4") {
  const safeExtension = String(extension)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  if (!safeExtension) {
    throw new Error("Extensão de ficheiro inválida.");
  }

  const filename = `${Date.now()}-${require("crypto").randomUUID()}.${safeExtension}`;

  return path.join(getOutputDirectory(), filename);
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function getFileInfo(filePath) {
  if (!fileExists(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);

  return {
    name: path.basename(filePath),
    path: filePath,
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    isFile: stats.isFile(),
  };
}

function deleteFile(filePath) {
  if (!filePath || !fileExists(filePath)) {
    return false;
  }

  const outputDirectory = path.resolve(getOutputDirectory());
  const resolvedPath = path.resolve(filePath);

  if (
    resolvedPath === outputDirectory ||
    !resolvedPath.startsWith(outputDirectory + path.sep)
  ) {
    throw new Error("Não é permitido eliminar ficheiros fora da pasta outputs.");
  }

  if (!fs.statSync(resolvedPath).isFile()) {
    throw new Error("O caminho indicado não é um ficheiro.");
  }

  fs.unlinkSync(resolvedPath);

  return true;
}

module.exports = {
  ensureDirectory,
  getOutputDirectory,
  createOutputPath,
  fileExists,
  getFileInfo,
  deleteFile,
};
