#!/usr/bin/env bash
set -euo pipefail

# Build image

docker build -t portfolio .

# Run locally on port 3000 with env vars

docker run --rm --name portfolio -p 3000:3000 --env-file .env portfolio

# Trigger Cloud Build deploy

gcloud builds submit --config cloudbuild.yaml .
