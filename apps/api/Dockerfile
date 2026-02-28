FROM node:22-alpine
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-domain/package.json packages/shared-domain/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json

RUN pnpm install --filter api... --ignore-scripts

COPY apps/api apps/api
COPY packages/shared-domain packages/shared-domain
COPY packages/api-contracts packages/api-contracts

WORKDIR /workspace/apps/api
EXPOSE 3000
CMD ["pnpm", "dev"]

