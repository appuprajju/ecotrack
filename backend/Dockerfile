# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install OpenSSL and other required dependencies
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install OpenSSL in production stage as well
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/index.js"]