FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

COPY frontend/package.json frontend/package-lock.json* ./frontend/

WORKDIR /app/frontend
RUN npm install

COPY frontend/ /app/frontend/

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html

COPY <<'NGINX_CONF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # Динамический DNS Docker: после пересборки backend IP меняется — иначе nginx отдаёт 502 со старым адресом
    location /api/ {
        resolver 127.0.0.11 valid=10s ipv6=off;
        set $api_upstream backend:8080;
        proxy_pass http://$api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_CONF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

