# Multi-stage Dockerfile for the LiveKit voice worker.
#
# Base image: node:20-slim (Debian glibc), NOT alpine.
# LiveKit's @livekit/rtc-node ships native bindings only for glibc Linux
# (`linux-x64-gnu` / `linux-arm64-gnu`), darwin, and win32 — there is NO
# `linux-x64-musl` (Alpine) build. Running on alpine fails at boot with
# "Cannot find module @livekit/rtc-ffi-bindings-linux-x64-musl".
# Verified against @livekit/rtc-ffi-bindings@0.12.52 optionalDependencies.

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# --include=optional ensures the platform-specific native binding from
# optionalDependencies is installed. Without it, npm's optional-deps
# bug (npm/cli#4828) sometimes drops the binding when there's a
# package-lock.json present.
RUN npm install --include=optional --ignore-scripts

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Install system CA certificates. node:20-slim is debian-bookworm-slim,
# which deliberately strips ca-certificates to keep the image small.
# Node's bundled OpenSSL ships its own CA store (Node fetch works fine),
# but the rtc-node Rust binding's reqwest+rustls stack falls back to the
# system CA store depending on its build configuration. With no system
# CAs, every HTTPS handshake from rtc-node fails before it gets a
# response — matching the "error sending request for url" symptom on
# https://*.livekit.cloud/settings/regions even though Node fetch to the
# same URL succeeds with HTTP 200 in 100ms from the same container.
# Also export SSL_CERT_FILE so any Rust crate that honors the env var
# picks the system store explicitly rather than relying on its own
# bundled webpki-roots (some rtc-node builds use rustls-native-certs).
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV SSL_CERT_DIR=/etc/ssl/certs
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Voice worker is a long-running process; Railway monitors stdout for
# health. No HTTP port is exposed — the worker registers with LiveKit
# Cloud over WebSocket and waits for room dispatches.
CMD ["node", "dist/agent.js", "start"]
