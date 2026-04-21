FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./

FROM base AS deps
RUN npm ci

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev:docker"]

FROM deps AS builder
COPY . .
RUN npm run db:generate
RUN npm run build -- --no-lint

FROM node:24-alpine AS production
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/auth.ts ./auth.ts
COPY --from=builder /app/middleware.ts ./middleware.ts
EXPOSE 3000
CMD ["npm", "run", "start"]
