FROM node:22-alpine
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web-provider-portal/package.json apps/web-provider-portal/package.json

RUN pnpm install --filter web-provider-portal... --ignore-scripts

COPY apps/web-provider-portal apps/web-provider-portal

WORKDIR /workspace/apps/web-provider-portal
EXPOSE 3002
CMD ["pnpm", "dev"]

