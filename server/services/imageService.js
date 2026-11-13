
const fs = require("fs");
const path = require("path");
const config = require("../config");

const CLOUDFLARE_MODEL =
  "@cf/black-forest-labs/flux-1-schnell";

function dimensionsFor(ratio) {
  const dimensions = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "4:5": { width: 1024, height: 1280 },
    "4:3": { width: 1200, height: 900 }
  };

  return dimensions[ratio] || dimensions["1:1"];
}

async function generateImage({
  prompt,
  outputPath,
  ratio = "1:1"
}) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error("A descrição da imagem é obrigatória.");
  }

  if (!outputPath) {
    throw new Error("O caminho de saída é obrigatório.");
  }

  if (String(prompt).length > 2048) {
    throw new Error("A descrição não pode ultrapassar 2048 caracteres.");
  }

  if (config.imageProvider !== "cloudflare") {
    throw new Error(
      "O fornecedor de imagens não está configurado para Cloudflare."
    );
  }

  if (!config.cloudflareAccountId || !config.cloudflareApiToken) {
    throw new Error(
      "Configure CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN."
    );
  }

  const outputDir = path.dirname(outputPath);

  fs.mkdirSync(outputDir, { recursive: true });

  const endpoint =
    `https://api.cloudflare.com/client/v4/accounts/` +
    `${config.cloudflareAccountId}/ai/run/${CLOUDFLARE_MODEL}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.cloudflareApiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: String(prompt).trim(),
      steps: 4
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Cloudflare AI respondeu com erro HTTP ${response.status}: ` +
      errorText.slice(0, 500)
    );
  }

  const data = await response.json();

  const imageBase64 =
    data.result?.image || data.image;

  if (
    !imageBase64 ||
    typeof imageBase64 !== "string"
  ) {
    throw new Error(
      "O fornecedor não devolveu uma imagem válida."
    );
  }

  const imageBuffer = Buffer.from(imageBase64, "base64");

  if (!imageBuffer.length) {
    throw new Error("A imagem recebida está vazia.");
  }

  fs.writeFileSync(outputPath, imageBuffer);

  const { width, height } = dimensionsFor(ratio);

  return {
    success: true,
    outputPath,
    format: "jpg",
    width,
    height,
    requestedRatio: ratio,
    model: CLOUDFLARE_MODEL,
    provider: "cloudflare"
  };
}

module.exports = {
  generateImage,
  dimensionsFor
};
