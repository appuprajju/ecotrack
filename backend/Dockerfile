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

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Create startup script that pushes DB schema then starts server
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'echo "Running Prisma DB push..."' >> /usr/src/app/start.sh && \
    echo 'npx prisma db push --skip-generate' >> /usr/src/app/start.sh && \
    echo 'echo "DB schema ready. Starting server..."' >> /usr/src/app/start.sh && \
    echo 'node dist/index.js' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

EXPOSE 8080

CMD ["/usr/src/app/start.sh"]