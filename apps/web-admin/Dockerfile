FROM node:22-alpine
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web-admin/package.json apps/web-admin/package.json

RUN pnpm install --filter web-admin... --ignore-scripts

COPY apps/web-admin apps/web-admin

WORKDIR /workspace/apps/web-admin
EXPOSE 3001
CMD ["pnpm", "dev"]

