# Stage 1 — Build
# Dùng node:18 (Debian/glibc) thay alpine vì @tailwindcss/oxide là Rust native binary
# cần glibc — alpine dùng musl nên không load được binding
FROM node:18 AS builder

WORKDIR /app

COPY package.json ./
# npm bug: optional native deps (@tailwindcss/oxide) đôi khi bị skip lần đầu
# Fix: install 2 lần + rebuild để đảm bảo native binding được download đúng platform
RUN npm install && npm install && npm rebuild

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
