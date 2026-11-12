# Global View AI Creator

Starter MVP for a web app that turns a prompt or a small set of photos into a short video.

## What is included

- React + Vite mobile-friendly interface (Portuguese).
- Node.js + Express API.
- Photo-to-video MVP using FFmpeg: accepts 3–5 photos, creates a 16:9, 9:16 or 1:1 slideshow video, and can add a music file supplied by the user.
- Optional SRT caption file generated from text supplied by the user.
- Modular provider boundary for future text-to-video APIs.
- Upload validation, basic rate limiting, Helmet and clear environment configuration.
- No payment collection, account system or external AI provider is enabled yet.

## Important: what is and is not AI in this first version

The photo workflow produces a real MP4 slideshow with fades using FFmpeg. It does **not** yet animate the contents of a photo with generative AI. Text-to-video, speech transcription/automatic subtitles, AI music selection and licensed asset search require external providers and API credentials. The project deliberately does not pretend those integrations are active.

Use only photos, audio and other assets that you own or are licensed to use. Do not scrape music or video from third-party services.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- FFmpeg installed and available on PATH (`ffmpeg -version`)

On Ubuntu:
```bash
sudo apt update
sudo apt install -y ffmpeg
```

## Run locally

From the project root:
```bash
cp .env.example .env
npm install
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`).
The API runs on `http://localhost:3001`.

## Create a production build

```bash
npm run build
npm start
```

The Express server serves the built frontend when `client/dist` exists.

## Test the API

```bash
curl http://localhost:3001/api/health
```

## Photo-to-video workflow

1. Select **Fotos → vídeo**.
2. Upload 3 to 5 JPG, PNG or WEBP photos (up to 15 MB each by default).
3. Enter a prompt/title and optional caption text.
4. Choose aspect ratio and duration.
5. Optionally add an MP3, WAV, M4A or AAC music file that you have rights to use.
6. Generate. The API returns an MP4 URL and, if caption text was supplied, an SRT file URL.

## Text-to-video integration (next development step)

`server/src/services/providers/textToVideoProvider.js` is the provider boundary. Connect a provider only after choosing a vendor and reviewing its current official API documentation, pricing, terms, supported regions and output rights.

Do not put API keys in frontend code. Store them in server environment variables. Never commit `.env`.

## Planned roadmap

### Phase 1 — Starter MVP (this ZIP)
- User interface and API foundation
- Photo slideshow rendering
- Music upload
- Caption text export as SRT

### Phase 2 — Generative AI
- Text-to-video provider integration
- Image animation / image-to-video provider integration
- Job status and retry handling
- Automatic speech-to-text captions

### Phase 3 — Creator tools
- Timeline editor, trims, transitions and templates
- Brand kit, logos and reusable project drafts
- Licensed music and stock-asset integrations

### Phase 4 — Business
- User accounts and secure project storage
- Credit ledger and subscription plans
- Payment gateway integration
- Admin dashboard, usage limits, abuse prevention and audit logs

## Security and production checklist

This is a development starter, not a production-ready SaaS. Before public launch:
- Add authentication, authorization and per-user file ownership.
- Move uploads and outputs to private object storage.
- Add background jobs/queue and persistent job records.
- Add malware scanning, stricter file inspection and retention/deletion policies.
- Add provider quotas, cost controls and request idempotency.
- Add payment-provider webhooks and a server-side credit ledger; never trust a price or credit balance sent by the browser.
- Add tests, monitoring, backups and privacy/terms pages.

## Project structure

```text
global-view-ai-creator/
├── client/                 # React + Vite interface
├── server/                 # Express API and FFmpeg workflow
├── .env.example
├── package.json
└── README.md
```
