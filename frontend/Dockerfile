# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
# Limit envsubst to only replace BACKEND_URL to avoid breaking Nginx internal variables
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

# Custom nginx config to redirect API calls and handle React SPA routing
RUN mkdir -p /etc/nginx/templates && echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    location /api { \
    proxy_pass ${BACKEND_URL}; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_cache_bypass $http_upgrade; \
    } \
    }' > /etc/nginx/templates/default.conf.template


CMD ["nginx", "-g", "daemon off;"]

