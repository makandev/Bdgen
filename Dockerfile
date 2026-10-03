# Server-Version von Bdgen
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_PUBLIC_MODE=server
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:server && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_PUBLIC_MODE=server PORT=3000 DATABASE_PATH=/app/data/bdgen.db
COPY --from=build /app/package.json /app/next.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME /app/data
EXPOSE 3000
CMD ["npx", "next", "start"]
