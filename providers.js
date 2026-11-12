export default function handler(_request, response) {
  response.status(200).json({
    photoToVideo: {
      available: false,
      engine: "not-connected",
      note: "Connect a dedicated video-rendering worker before enabling uploads."
    },
    textToVideo: {
      available: false,
      provider: process.env.TEXT_TO_VIDEO_PROVIDER || "none",
      note: "Connect a generative video provider using a server-side API key."
    },
    automaticSpeechCaptions: {
      available: false,
      note: "Connect a speech-to-text provider."
    }
  });
}
