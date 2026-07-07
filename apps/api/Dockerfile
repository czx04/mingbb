FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api ./apps/api
RUN npm ci --workspace apps/api --include-workspace-root
RUN npm --workspace apps/api run build
RUN npm prune --workspace apps/api --omit=dev --include-workspace-root && npm cache clean --force

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
