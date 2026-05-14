# Stage 1 — Build
# node:18 (Debian/glibc) cho @tailwindcss/oxide native binding
FROM --platform=linux/amd64 node:20 AS builder

WORKDIR /app

COPY package.json ./
# node:20 đáp ứng yêu cầu @tailwindcss/oxide >= 20
# Sau install chính, install thẳng native binding để tránh npm optional dep bug
RUN npm install && \
    npm install @tailwindcss/oxide-linux-x64-gnu --save-optional

COPY . .

# VITE_API_URL và VITE_SOCKET_URL được inject lúc build qua --build-arg
ARG VITE_API_URL=http://localhost:3000
ARG VITE_SOCKET_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# Stage 2 — Serve
FROM --platform=linux/amd64 nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
