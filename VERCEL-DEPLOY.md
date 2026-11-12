# Deploy Global View AI Creator on Vercel

This repository is configured for a Vercel preview deployment.

## Import from GitHub

1. Create a new GitHub repository named `global-view-ai-creator`.
2. Upload the contents of this ZIP to the repository root (do not upload the ZIP itself).
3. In Vercel, choose **Add New → Project** and import that GitHub repository.
4. Keep the project root as `./` (repository root).
5. Vercel should use the included `vercel.json`:
   - Install command: `npm install`
   - Build command: `npm run build --workspace=client`
   - Output directory: `client/dist`
6. Deploy.

## What this deployment includes

- Public React/Vite frontend.
- Vercel serverless health and provider-status endpoints.
- A safe placeholder generation endpoint.
- The local Express + FFmpeg backend remains available for development.

## Important limitation

This Vercel deployment is a **frontend and API preview**, not yet a working hosted video-rendering service. Vercel Functions have a 4.5 MB request/response payload limit. The video workflow should therefore upload source media directly to object storage and send a job to a separate rendering worker, rather than sending several full-size photos through a Vercel Function.

Recommended production architecture:
- Vercel: frontend, authentication UI and short API requests.
- Object storage: private photo/audio/video files with signed upload/download URLs.
- Video worker: FFmpeg and AI provider orchestration, running as a background job.
- Database/queue: job state, user ownership, credits and retry tracking.

Do not add paid provider keys to frontend variables. Add secrets only as server-side environment variables after choosing the provider and worker.

## Local development remains available

Requirements: Node.js 20+, npm 10+, FFmpeg installed.

```bash
cp .env.example .env
npm install
npm run dev
```

The local Vite server proxies `/api` and `/outputs` to the Express backend on port 3001. The local photo-to-video workflow remains available there.

## Official Vercel guidance

- Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
- Function limits: https://vercel.com/docs/functions/limitations
