# MING Platform

Base monorepo:

- Frontend: Next.js + Tailwind CSS in `apps/web`
- Backend: NestJS in `apps/api`
- Database/Auth/Storage: Supabase
- CI/CD: frontend deploys to Vercel, backend deploys to Render

## Requirements

- Node.js 22+
- npm 10+
- Supabase project
- Vercel project for `apps/web`
- Render Web Service for `apps/api`
- Docker Hub repository for `ming-api`

## Local setup

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm run dev
```

Frontend runs at `http://localhost:3000`.
Backend runs at `http://localhost:4000/api`.
Admin runs at `http://localhost:3001`.

The development runner starts all three services and stores Next.js development artifacts in
`.next-dev`. Production builds continue to use `.next`, so running a build cannot overwrite files
used by an active development server.

## Docker

Build and run the backend container locally:

```bash
docker compose up --build api
```

The API runs at `http://localhost:4000/api`.

## Environment variables

### Frontend

Set these in `apps/web/.env.local` and Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

### Backend

Set these in `apps/api/.env` and Render environment settings:

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `FRONTEND_URL`
- `ADMIN_URL`
- `TRUST_PROXY_HOPS` (`1` on Render, `0` for direct local access)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `REDIS_KEY_PREFIX`
- `RATE_LIMIT_HASH_SECRET`

The API uses Upstash Redis for shared rate limits and short-lived booking caches. Use different
`REDIS_KEY_PREFIX` values for development, staging, and production. Generate
`RATE_LIMIT_HASH_SECRET` as a long random value; it is used to avoid storing raw IP addresses and
phone numbers in rate-limit keys.

## GitHub Actions secrets

For Vercel deployment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

For Render deployment:

- `RENDER_DEPLOY_HOOK_URL`

For Docker Hub image publishing:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Backend deploy flow

The backend deploy workflow is image-based:

1. GitHub Actions verifies `apps/api` with lint, test, and build.
2. GitHub Actions builds `apps/api/Dockerfile` for `linux/amd64`.
3. The image is pushed to Docker Hub as `${DOCKERHUB_USERNAME}/ming-api:latest` and `${DOCKERHUB_USERNAME}/ming-api:<commit-sha>`.
4. GitHub Actions calls the Render deploy hook with the commit SHA image URL.
5. Render pulls the Docker Hub image and redeploys the service.

In `render.yaml`, replace this placeholder with your real Docker Hub image:

```yaml
image:
  url: docker.io/your-dockerhub-username/ming-api:latest
```
