export default function handler(_request, response) {
  response.status(200).json({
    ok: true,
    service: "global-view-ai-creator",
    deployment: "vercel",
    version: "0.2.0"
  });
}
