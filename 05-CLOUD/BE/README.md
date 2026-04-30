# 05-CLOUD/BE — Cloud Backend

**Nhóm:** Trần Kim Phương · Lê Đức Ngọc | **GVHD:** TS. Nguyễn Huỳnh Duy Khang  
**Trạng thái:** ✅ HOÀN THÀNH | **Stack:** Node.js 18+ / Express / MongoDB / MQTT / Socket.io | **Port:** 3000

> Xem `DESIGN.md` để đọc đầy đủ schema MongoDB, thiết kế API, và MQTT flow.

---

## Vai trò trong hệ thống

```
[Hub — Orange Pi]
    │  paho-mqtt TLS :8883
    ▼
[Cloud MQTT Broker]  ← HiveMQ Free / EMQX Cloud
    │  mqtt.js TLS :8883
    ▼
[Cloud BE — Node.js]  ← REST + Socket.io
    ├─ mqttService       subscribe/publish cloud broker
    ├─ Express REST API  cho FE gọi
    ├─ Socket.io         push realtime xuống browser
    └─ MongoDB           lưu lịch sử sensor, auth, hub config, rules
    │
    │  REST + WebSocket
    ▼
[FE — React/Vite]
```

**BE không tự xử lý automation logic** — relay lệnh, lưu lịch sử, và chuyển tiếp rule config từ user xuống Hub. Hub là nơi thực thi rules.

---

## Cấu trúc file

```
05-CLOUD/BE/
├── src/
│   ├── app.js              Express app setup, route mount, error handler
│   ├── server.js           HTTP server + Socket.io + MQTT start, MongoDB connect
│   │
│   ├── config/
│   │   ├── db.js           MongoDB connection (mongoose)
│   │   ├── env.js          Load + validate .env
│   │   └── mqtt.js         Cloud MQTT client singleton
│   │
│   ├── models/
│   │   ├── User.js         Auth users (bcrypt password)
│   │   ├── Hub.js          Hub registry + config_json (locations, devices)
│   │   ├── SensorHistory.js Time-series sensor data
│   │   ├── CommandLog.js   Command tracking + ack status
│   │   └── Rules.js        Rule config per hub (sync với hub)
│   │
│   ├── services/
│   │   ├── mqttService.js    Subscribe cloud broker, dispatch messages
│   │   ├── hubService.js     Update hub state, parse config_json
│   │   ├── commandService.js Publish command + chờ ack (Promise + 10s timeout)
│   │   ├── rulesService.js   Lưu rules vào DB, publish xuống hub (QoS 1, retain)
│   │   └── socketService.js  Push realtime events xuống browser (Socket.io)
│   │
│   ├── routes/
│   │   ├── auth.js         POST /auth/login, /auth/refresh, /auth/logout
│   │   ├── state.js        GET /api/state, /api/state/:locationId
│   │   ├── control.js      POST /api/control/:locationId/:actuator
│   │   ├── history.js      GET /api/history
│   │   ├── rules.js        GET /api/rules, PUT /api/rules
│   │   └── hub.js          GET /api/hub/status, /api/hub/devices
│   │
│   ├── middleware/
│   │   └── auth.js         Verify JWT, attach req.user
│   │
│   └── socket/
│       └── index.js        Socket.io setup, room management
│
├── .env.example
├── package.json
├── DESIGN.md               Thiết kế đầy đủ (schema, API, MQTT flow)
└── README.md               File này
```

---

## REST API

Base URL: `http://localhost:3000`

### Auth

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/auth/login` | Đăng nhập → `{accessToken, refreshToken}` |
| POST | `/auth/refresh` | Làm mới token → `{accessToken}` |
| POST | `/auth/logout` | Đăng xuất |

- `accessToken`: JWT 15 phút
- `refreshToken`: JWT 7 ngày

### State

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/state` | Snapshot tất cả locations (từ Hub config + SensorHistory mới nhất) |
| GET | `/api/state/:locationId` | State 1 location |

### Control

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/control/:locationId/:actuator` | Gửi lệnh → Hub, chờ ack 10s |

Request body: `{"state": true}`  
Response khi ack thành công: `{"ok": true, "ackedAt": "..."}`

### History

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/history` | Lịch sử sensor (query: `locationId`, `sensorType`, `hours`) |

### Rules

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/rules` | Rule config hiện tại của hub |
| PUT | `/api/rules` | Lưu vào DB + publish xuống hub (QoS 1, retain) |

### Hub

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/hub/status` | Online/offline + lastSeen của hub |
| GET | `/api/hub/devices` | Danh sách locations + ESP32 từ hub config |

---

## Socket.io Events (BE → FE)

```
"state_update"   { locationId, sensorType, value, unit, timestamp }
"hub_status"     { hubId, online, lastSeen }
"command_ack"    { commandId, success, ackedAt }
"rules_synced"   { syncedAt }
```

---

## MQTT Topics (Cloud Broker)

### Hub → Cloud BE (BE subscribe)
```
cloud/{hub_id}/{location_id}/sensors/{type}  — sensor data (batch mỗi 10s)
cloud/{hub_id}/status                         — "online"/"offline" (retain)
cloud/{hub_id}/config                         — JSON layout devices (retain)
cloud/{hub_id}/ack/{command_id}               — {"success": true}
cloud/{hub_id}/rules_ack                      — {"synced": true, "timestamp": "..."}
```

### Cloud BE → Hub (BE publish, retain)
```
cloud/{hub_id}/cmd/{location_id}/{actuator}   — {"state": true, "command_id": "uuid"}
cloud/{hub_id}/rules                          — rule config JSON (QoS 1, retain)
```

---

## Setup & chạy

```bash
cd 05-CLOUD/BE
npm install
cp .env.example .env   # điền đủ các biến
node src/server.js     # hoặc: npm run dev (nodemon)
```

**File `.env` cần thiết lập:**
```ini
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smarthome

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Cloud MQTT Broker (HiveMQ / EMQX)
CLOUD_MQTT_BROKER=xxxx.hivemq.cloud
CLOUD_MQTT_PORT=8883
CLOUD_MQTT_USER=
CLOUD_MQTT_PASSWORD=

# Hub ID (phải khớp với CLOUD_HUB_ID trong Hub's .env)
HUB_ID=smarthome-hub-001

# CORS
CORS_ORIGINS=http://localhost:5173
```

**Output mong đợi:**
```
🚀 Cloud BE running on http://localhost:3000
   ENV: development
   HUB: smarthome-hub-001
```

---

## Dependencies

| Package | Version | Dùng cho |
|---------|---------|---------|
| `express` | ^4.19 | HTTP framework |
| `mongoose` | ^8.3 | MongoDB ORM |
| `mqtt` | ^5.7 | Cloud MQTT client |
| `socket.io` | ^4.7 | WebSocket push |
| `jsonwebtoken` | ^9.0 | JWT auth |
| `bcryptjs` | ^2.4 | Hash password |
| `uuid` | ^9.0 | Command ID |
| `cors` | ^2.8 | CORS headers |
| `dotenv` | ^16.4 | Env vars |
