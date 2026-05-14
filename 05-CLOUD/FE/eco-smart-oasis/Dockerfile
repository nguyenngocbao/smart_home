# Stage 1 — Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Dùng npm install thay --frozen-lockfile vì @tailwindcss/oxide dùng native binding
# package-lock.json gen trên macOS sẽ thiếu bản Linux nếu dùng --frozen-lockfile
RUN npm install

COPY . .

# VITE_API_URL và VITE_SOCKET_URL được inject lúc build qua --build-arg
ARG VITE_API_URL=http://localhost:3000
ARG VITE_SOCKET_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# Stage 2 — Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
