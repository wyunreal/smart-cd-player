# 1. Dependencies (no ffmpeg needed for build)
ARG BUILD_PLATFORM=linux/amd64
FROM --platform=$BUILD_PLATFORM cgr.dev/chainguard/node:latest-dev AS deps
USER root
WORKDIR /app

COPY package.json yarn.lock ./
COPY digit-classifier/inference/package.json digit-classifier/inference/

RUN yarn --frozen-lockfile --production=false

# 2. Builder
FROM --platform=$BUILD_PLATFORM cgr.dev/chainguard/node:latest-dev AS builder
USER root
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build inference package (tsc is in root node_modules/.bin/)
RUN cd digit-classifier/inference && ../../node_modules/.bin/tsc
# Sync built output to the node_modules copy (yarn v1 file: protocol copies at install time)
RUN cp -r digit-classifier/inference/dist node_modules/digit-classifier/
# Build main project
RUN yarn build

# 3. Runner — ffmpeg required for V4L2 video capture
FROM --platform=$BUILD_PLATFORM cgr.dev/chainguard/node:latest-dev AS runner
WORKDIR /app

USER root
RUN apk add --no-cache ffmpeg

# v4l-utils is not packaged by Chainguard/Wolfi. v4l2-ctl is prebuilt and
# stored in vendor/v4l2-ctl; copy it locally, no package manager involved.
COPY vendor/v4l2-ctl/bin/v4l2-ctl /usr/local/bin/v4l2-ctl
COPY vendor/v4l2-ctl/lib/ /usr/local/lib/v4l/
ENV LD_LIBRARY_PATH=/usr/local/lib/v4l
RUN v4l2-ctl --version
USER node

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/digit-classifier/model ./digit-classifier/model
COPY --from=builder /app/digit-classifier/inference/dist ./digit-classifier/inference/dist
COPY --from=builder /app/digit-classifier/inference/package.json ./digit-classifier/inference/
COPY --from=builder /app/config.json ./config.json

EXPOSE 3100

CMD ["dist/src/main.js"]
