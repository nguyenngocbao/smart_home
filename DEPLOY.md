# Hướng dẫn Deploy — Eco-Smart Oasis

## Yêu cầu VPS
- Ubuntu 22.04+
- Docker + Docker Compose v2
- Nginx (đã cài)
- MongoDB (đã cài, đang chạy)
- Git

---

## LẦN ĐẦU TIÊN — Setup từ đầu

### 1. Cài Docker (nếu chưa có)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version          # kiểm tra
docker compose version    # kiểm tra
```

### 2. Pull code về VPS

```bash
git clone <your-repo-url> ~/smarthome
cd ~/smarthome
```

### 3. Tạo file `.env`

```bash
cp .env.example .env
nano .env
```

Điền các giá trị thật:

```env
# Ports
CLOUD_BE_PORT=3000
CLOUD_FE_PORT=5173
SMARTHUB_PORT=5001

# MongoDB — URI của MongoDB trên VPS
MONGODB_URI=mongodb://user:pass@localhost:27017/smarthome?authSource=admin

# JWT (tạo random: openssl rand -hex 32)
JWT_SECRET=<chạy: openssl rand -hex 32>
REFRESH_TOKEN_SECRET=<chạy: openssl rand -hex 32>

# CORS — domain FE của bạn
CORS_ORIGINS=https://yourdomain.com,http://localhost

HUB_ID=smarthome-hub-001

# MQTT HiveMQ
MQTT_BROKER_URL=mqtts://fded182921f94059b52bc084fc607d3b.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=smarthome
MQTT_PASSWORD=Smarthome123
MQTT_CLIENT_ID=cloud-be-server

# Smart Hub
SECRET_KEY=<chạy: openssl rand -hex 24>
MQTT_BROKER=fded182921f94059b52bc084fc607d3b.s1.eu.hivemq.cloud
MQTT_USER=smarthome
CLOUD_MQTT_BROKER=fded182921f94059b52bc084fc607d3b.s1.eu.hivemq.cloud
CLOUD_MQTT_PORT=8883
CLOUD_MQTT_USER=smarthome
CLOUD_MQTT_PASSWORD=Smarthome123
CLOUD_HUB_ID=smarthome-hub-001

# FE — trỏ đến IP/domain của cloud-be
VITE_API_URL=http://your-vps-ip:3000
VITE_SOCKET_URL=http://your-vps-ip:3000
```

> **Tip sinh secret nhanh:**
> ```bash
> openssl rand -hex 32   # dùng cho JWT_SECRET
> openssl rand -hex 32   # dùng cho REFRESH_TOKEN_SECRET
> openssl rand -hex 24   # dùng cho SECRET_KEY
> ```

### 4. Cho Docker containers kết nối MongoDB trên host

MongoDB chạy trên host VPS, Docker container cần kết nối vào. Cần thêm `host.docker.internal` hoặc dùng IP bridge:

```bash
# Cách 1 — thêm host-gateway (khuyên dùng, Ubuntu)
# Trong .env đổi MONGODB_URI thành:
MONGODB_URI=mongodb://user:pass@host-gateway:27017/smarthome?authSource=admin
```

Và thêm vào `docker-compose.yml` phần `cloud-be` (chỉ làm 1 lần):
```bash
# Thêm dòng này vào service cloud-be trong docker-compose.yml
extra_hosts:
  - "host-gateway:host-gateway"
```

> Hoặc đơn giản hơn: dùng IP bridge mặc định của Docker là `172.17.0.1`
> ```env
> MONGODB_URI=mongodb://user:pass@172.17.0.1:27017/smarthome?authSource=admin
> ```

### 5. Build và chạy

```bash
cd ~/smarthome
docker compose up -d --build
```

Lần đầu sẽ mất 3–5 phút (build image).

### 6. Kiểm tra các container đang chạy

```bash
docker compose ps
```

Kết quả mong đợi:
```
NAME                  STATUS
smarthome-cloud-be    Up (healthy)
smarthome-cloud-fe    Up
smarthome-hub         Up
```

### 7. Kiểm tra hoạt động

```bash
# Cloud BE
curl http://localhost:3000/health
# → {"ok":true,"time":"..."}

# Smart Hub
curl http://localhost:5001/api/health
# → {"status":"ok","mqtt_connected":true,...}

# Cloud FE — mở trình duyệt
http://your-vps-ip:5173
```

### 8. Config Nginx

Tạo file config cho từng service:

```bash
sudo nano /etc/nginx/sites-available/smarthome
```

```nginx
# Cloud FE
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Cloud BE (API + WebSocket)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smarthome /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## KHI CÓ THAY ĐỔI CODE — Update & Apply

### Trường hợp 1: Chỉ thay đổi code (không đổi .env, không thêm package)

```bash
cd ~/smarthome
git pull

# Rebuild image và restart chỉ service liên quan
docker compose up -d --build cloud-be      # nếu sửa Cloud BE
docker compose up -d --build smarthub      # nếu sửa Hub
docker compose up -d --build cloud-fe      # nếu sửa Cloud FE (build lại React)
```

### Trường hợp 2: Có thêm package mới (npm/pip)

```bash
git pull
docker compose up -d --build <service>
# --build tự chạy lại npm install / pip install trong Dockerfile
```

### Trường hợp 3: Có thay đổi `.env`

```bash
nano .env   # sửa giá trị
docker compose up -d   # restart với env mới (không cần --build)
```

> **Lưu ý:** Nếu đổi `VITE_API_URL` hoặc `VITE_SOCKET_URL` phải `--build cloud-fe`
> vì Vite bake giá trị này vào lúc build.
> ```bash
> docker compose up -d --build cloud-fe
> ```

### Trường hợp 4: Rebuild toàn bộ từ đầu

```bash
git pull
docker compose down
docker compose up -d --build
```

---

## Lệnh thường dùng

```bash
# Xem log realtime
docker compose logs -f
docker compose logs -f cloud-be
docker compose logs -f smarthub

# Restart 1 service
docker compose restart cloud-be

# Dừng tất cả
docker compose down

# Xem tài nguyên từng container
docker stats

# Vào shell trong container (debug)
docker exec -it smarthome-cloud-be sh
docker exec -it smarthome-hub bash
```

---

## Cấu trúc port tóm tắt

| Service | Port VPS | Nginx proxy từ |
|---------|----------|----------------|
| Cloud BE | 3000 | api.yourdomain.com |
| Cloud FE | 5173 | yourdomain.com |
| Smart Hub | 5001 | (internal, không cần expose) |
