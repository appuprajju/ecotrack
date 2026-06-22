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
ENV PORT=8080
ENV BACKEND_URL=http://localhost:5000
# Limit envsubst to only replace BACKEND_URL and PORT to avoid breaking Nginx internal variables
ENV NGINX_ENVSUBST_FILTER="BACKEND_URL|PORT"

# Custom nginx config to redirect API calls and handle React SPA routing
RUN mkdir -p /etc/nginx/templates && echo 'server { \
    listen ${PORT}; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    location /api { \
    proxy_pass ${BACKEND_URL}; \
    proxy_http_version 1.1; \
    proxy_set_header Host $proxy_host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    proxy_ssl_server_name on; \
    } \
    }' > /etc/nginx/templates/default.conf.template


CMD ["nginx", "-g", "daemon off;"]

