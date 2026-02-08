# Portfolio

Next.js 16 (App Router) portfolio with terminal-style UI, AI chat, standalone build, and Docker/Cloud Run deployment.

## Run locally
- Install deps: `npm install --legacy-peer-deps`
- Dev server: `npm run dev` → http://localhost:3000
- Lint: `npm run lint`

## Docker
- Build: `docker build -t portfolio .`
- Run on 3000: `docker run --rm --name portfolio -p 3000:3000 --env-file .env portfolio`

## Cloud Run via Cloud Build (CI/CD)
1) Enable `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`.
2) Create Artifact Registry repo (Docker) in your region.
3) Add `cloudbuild.yaml` (build → push → deploy to Cloud Run on port 3000).
4) Create a Cloud Build trigger on `main` (GitHub) using `cloudbuild.yaml`.
5) Push to `main` becomes your one-command deploy.

Manual deploy from local (optional):
```bash
gcloud builds submit --config cloudbuild.yaml .
```

## Notes
- `next.config.ts` already sets `output: "standalone"` for slimmer runtime images.
- Favicon comes from `public/favicon.ico` (wired in `app/head.tsx` and `app/layout.tsx`).
- `google-cloud-sdk` and downloaded archives are ignored—install the SDK in your home directory if needed.
# portfolio
