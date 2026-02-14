# 1. Base image
FROM node:18-slim AS base

# Install mDNS dependencies (Debian/Ubuntu)
RUN apt-get update && apt-get install -y --no-install-recommends \
    avahi-utils \
    libnss-mdns \
    && rm -rf /var/lib/apt/lists/*

# Configure NSS to use mDNS
# This line tells the system to check mDNS for .local domains, and standard DNS for everything else.
RUN echo "hosts: files mdns4_minimal [NOTFOUND=return] dns" > /etc/nsswitch.conf

# 2. Dependencies
FROM base AS deps
# libc6-compat is often needed for Alpine, but we are on Debian now. 
# However, some native modules might still need build tools.
# For compatibility with potential lockfile variances, we keep it simple or install build-essential if needed.
# Converting apk add to apt-get for consistency if needed, but 'base' already has glibc (it's debian).
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# 4. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
