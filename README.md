# MING Platform

Base monorepo:

- Frontend: Next.js + Tailwind CSS in `apps/web`
- Backend: NestJS in `apps/api`
- Database/Auth/Storage: Supabase
- CI/CD: frontend deploys to Vercel, backend deploys to Render

## Requirements

- Node.js 20+
- npm 10+
- Supabase project
- Vercel project for `apps/web`
- Render Web Service for `apps/api`

## Local setup

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm run dev
```

Frontend runs at `http://localhost:3000`.
Backend runs at `http://localhost:4000/api`.

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

## GitHub Actions secrets

For Vercel deployment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

For Render deployment:

- `RENDER_DEPLOY_HOOK_URL`

