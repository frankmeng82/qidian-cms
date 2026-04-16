FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install

COPY . .
RUN npm run prisma:generate --workspace @qidian-cms/backend
RUN npm run build --workspace @qidian-cms/backend

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/backend/package.json /app/apps/backend/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

EXPOSE 3000
CMD ["node", "apps/backend/dist/server.js"]
