# 1. Dependencies (no ffmpeg needed for build)
ARG BUILD_PLATFORM=linux/amd64
FROM --platform=$BUILD_PLATFORM cgr.dev/chainguard/node:latest-dev AS deps
USER root
WORKDIR /app

COPY package.json yarn.lock ./
COPY half-digit-classifier/inference/package.json half-digit-classifier/inference/

RUN yarn --frozen-lockfile --production=false

# 2. Builder
FROM --platform=$BUILD_PLATFORM cgr.dev/chainguard/node:latest-dev AS builder
USER root
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build inference package (tsc is in root node_modules/.bin/)
RUN cd half-digit-classifier/inference && ../../node_modules/.bin/tsc
# Sync built output to the node_modules copy (yarn v1 file: protocol copies at install time)
RUN cp -r half-digit-classifier/inference/dist node_modules/half-digit-classifier/
# Build main project
RUN yarn build

# 3. Runner — ffmpeg required for V4L2 video capture
FROM --platform=$BUILD_PLATFORM cgr.dev/chainguard/node:latest-dev AS runner
WORKDIR /app

USER root
RUN apk add --no-cache ffmpeg
USER node

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/half-digit-classifier/model ./half-digit-classifier/model
COPY --from=builder /app/half-digit-classifier/inference/dist ./half-digit-classifier/inference/dist
COPY --from=builder /app/half-digit-classifier/inference/package.json ./half-digit-classifier/inference/
COPY --from=builder /app/config.json ./config.json

EXPOSE 3100

CMD ["dist/src/main.js"]
