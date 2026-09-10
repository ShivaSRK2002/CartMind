FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY apps/api/package.json apps/api/

RUN npm ci --workspace=packages/shared-types --workspace=apps/api --include-workspace-root

COPY packages/shared-types packages/shared-types
COPY apps/api apps/api
COPY db/migrations db/migrations

RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY apps/api/package.json apps/api/

RUN npm ci --workspace=packages/shared-types --workspace=apps/api --include-workspace-root --omit=dev

COPY --from=builder /app/packages/shared-types/dist packages/shared-types/dist
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/src/openapi.json apps/api/dist/openapi.json
COPY db/migrations db/migrations
COPY db/seed db/seed

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
