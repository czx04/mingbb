FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --workspace apps/api --include-workspace-root

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package*.json ./
COPY apps/api ./apps/api
RUN npm --workspace apps/api run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --workspace apps/api --omit=dev --include-workspace-root && npm cache clean --force
COPY --from=builder /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
