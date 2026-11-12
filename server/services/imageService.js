
const fs = require("fs");
const path = require("path");
const config = require("../config");

function dimensionsFor(ratio) {
  const dimensions = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "4:5": { width: 1024, height: 1280 },
    "4:3": { width: 1200, height: 900 },
  };

  return dimensions[ratio] || dimensions["1:1"];
}

async function generateImage({
  prompt,
  outputPath,
  ratio = "1:1",
}) {
  if (!prompt || !outputPath) {
    throw new Error("Prompt e outputPath são obrigatórios.");
  }

  const outputDir = path.dirname(outputPath);

  fs.mkdirSync(outputDir, { recursive: true });

  const { width, height } = dimensionsFor(ratio);

  const provider = config.imageProvider;

  if (!provider || provider === "none") {
    throw new Error(
      "Nenhum fornecedor de geração de imagens está configurado."
    );
  }

  throw new Error(
    `O fornecedor de imagens "${provider}" ainda precisa de integração. Dimensões solicitadas: ${width}x${height}.`
  );
}

module.exports = {
  generateImage,
  dimensionsFor,
};
