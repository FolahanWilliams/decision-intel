# Multi-stage Dockerfile for the LiveKit voice worker.
# Railway can also build straight from the npm scripts (no Dockerfile
# needed — the `start` script + `engines.node` is enough), but this
# Dockerfile is the deterministic path if you want it.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Voice worker is a long-running process; Railway monitors stdout for
# health. No HTTP port is exposed — the worker registers with LiveKit
# Cloud over WebSocket and waits for room dispatches.
CMD ["node", "dist/agent.js", "start"]
