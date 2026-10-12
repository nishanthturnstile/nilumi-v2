FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml biome.json ./
COPY tooling/scripts/ci-prepare.mjs tooling/scripts/pnpm-local.mjs tooling/scripts/process.mjs ./tooling/scripts/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/client/package.json ./apps/client/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY packages/server/package.json ./packages/server/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/ui/package.json ./packages/ui/
RUN node tooling/scripts/ci-prepare.mjs \
    && node tooling/scripts/pnpm-local.mjs install --frozen-lockfile
COPY tooling ./tooling
COPY packages ./packages
COPY apps ./apps
RUN node tooling/scripts/pnpm-local.mjs run build
RUN node tooling/scripts/package-runtime.mjs api /out/api \
    && node tooling/scripts/package-runtime.mjs worker /out/worker

FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS api
ARG NILUMI_COMMIT_SHA
LABEL org.opencontainers.image.revision=$NILUMI_COMMIT_SHA
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/api ./
COPY --chown=node:node infra/docker/migrate.mjs ./migrate.mjs
USER node
EXPOSE 3001
HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=6 CMD ["node", "--input-type=module", "-e", "const r=await fetch('http://127.0.0.1:3001/api/v1/ready',{signal:AbortSignal.timeout(2000)});if(!r.ok)process.exit(1)"]
CMD ["node", "dist/main.js"]

FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS worker
ARG NILUMI_COMMIT_SHA
LABEL org.opencontainers.image.revision=$NILUMI_COMMIT_SHA
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/worker ./
USER node
CMD ["node", "dist/main.js"]

FROM build AS export
# Public URL only. Relative same-origin API calls are selected by the release's public configuration.
ARG EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8082
ENV EXPO_NO_DOTENV=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_NILUMI_ENV=test EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
RUN node tooling/scripts/pnpm-local.mjs --filter @nilumi/client exec expo export --platform web

FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS web
ARG NILUMI_COMMIT_SHA
LABEL org.opencontainers.image.revision=$NILUMI_COMMIT_SHA
ENV NODE_ENV=production PORT=8082
WORKDIR /app
COPY --from=export --chown=node:node /workspace/apps/client/dist ./public
COPY --chown=node:node infra/docker/web-server.mjs ./web-server.mjs
USER node
EXPOSE 8082
HEALTHCHECK --interval=5s --timeout=3s --retries=6 CMD ["node", "--input-type=module", "-e", "const r=await fetch('http://127.0.0.1:8082/',{signal:AbortSignal.timeout(2000)});if(!r.ok)process.exit(1)"]
CMD ["node", "web-server.mjs"]
