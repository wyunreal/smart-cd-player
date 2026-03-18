# 1. Dependencies
ARG BUILD_PLATFORM=linux/amd64
FROM --platform=$BUILD_PLATFORM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --production=false

# 2. Builder — compile TypeScript and copy static assets
FROM --platform=$BUILD_PLATFORM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# 3. Runner — slim image with ffmpeg for ALSA audio capture
FROM --platform=$BUILD_PLATFORM node:22-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/audio-config.json ./audio-config.json

EXPOSE 3200

CMD ["node", "dist/src/main.js"]
