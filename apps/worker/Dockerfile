FROM node:22-alpine
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/package.json

RUN pnpm install --filter worker... --ignore-scripts

COPY apps/worker apps/worker

WORKDIR /workspace/apps/worker
CMD ["pnpm", "dev"]

