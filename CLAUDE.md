# CLAUDE.md — Smart Home IoT Project

> Đây là nguồn sự thật duy nhất về dự án. Luôn đọc trước khi làm bất cứ thứ gì.

---

## Dự án là gì

**Nhà Thành Thị Eco-Smart Oasis** — Hệ thống Smart Home IoT cho nhà phố, Quận 9, TP. Thủ Đức.  
Nhóm: Lê Đức Ngọc, Trần Kim Phương | GVHD: TS. Nguyễn Huỳnh Duy Khang

### Kiến trúc tổng quan

```
[Sensors/Actuators]
        │ GPIO
        ▼
[ESP32 × 2]  ──── MQTT local (port 1883) ────►  [Orange Pi Zero W — Hub]
  esp1: bedroom                                      Python 3.11 / Flask 3.0
  esp2: rooftop                                      MQTTService + SimpleRuleEngine
                                                     CloudSyncService + REST API :5000
                                                            │
                                                            │ MQTT TLS (port 8883)
                                                            ▼
                                                   [Cloud MQTT Broker]
                                                   HiveMQ / EMQX Cloud
                                                            │
                                                            ▼
                                                  [Cloud BE — Node.js :3000]
                                                  Express + MongoDB + Socket.io
                                                            │ REST + WebSocket
                                                            ▼
                                                  [Cloud FE — React/Vite :5173]
                                                  eco-smart-oasis Dashboard
```

---

## Cấu trúc folder — THỰC TẾ HIỆN TẠI

```
smarthome/
├── 02-FIRMWARE/                    ✅ DONE
│   ├── esp1/                       ESP32 #1 — phòng ngủ (bedroom)
│   │   ├── esp1.ino                Entry point (setup + loop)
│   │   ├── config.h                GPIO pins, WiFi, MQTT, ngưỡng tự động
│   │   ├── wifi_mqtt.h/.cpp        WiFi + MQTT client, heartbeat
│   │   ├── module2_rem.h/.cpp      Module 2: Rèm cửa (LDR GPIO34 + Servo GPIO13)
│   │   └── module3_den.h/.cpp      Module 3: Đèn chiếu sáng (Relay GPIO26 + GPIO27)
│   ├── esp2/                       ESP32 #2 — sân thượng (rooftop)
│   │   ├── esp2.ino                Entry point (setup + loop)
│   │   ├── config.h                GPIO pins, WiFi, MQTT, ngưỡng tự động
│   │   ├── wifi_mqtt.h/.cpp        WiFi + MQTT client, heartbeat
│   │   ├── module1_tuoi.h/.cpp     Module 1: Tưới cây (Soil GPIO34 + Relay GPIO26)
│   │   └── module4_cua_troi.h/.cpp Module 4: Cửa trời (DHT22 GPIO4 + Rain GPIO35 + Servo GPIO13)
│   ├── ESP32_CODING_GUIDE.md
│   └── README.md
│
├── 03-BACKEND/smart-home-hub/      ✅ DONE
│   ├── MY_DEVICES.py               ★ Cấu hình locations + ESP32 chips (sửa đây khi thêm phòng)
│   ├── MY_RULES.py                 ★ Automation rules sensor_rules() + time_rules()
│   ├── main.py                     Entry point — Flask + StateStore + MQTT + Scheduler + API
│   ├── .env / .env.example
│   ├── requirements.txt
│   ├── cloud_rules.json            Runtime file (không commit) — rule params từ cloud
│   ├── default_rules.json          Fallback rule params
│   ├── app/
│   │   ├── __init__.py             Flask factory + CORS + serve templates
│   │   ├── config.py               Đọc .env → Config dev/prod/test
│   │   └── models.py               Alert model (in-memory)
│   ├── services/
│   │   ├── state_store.py          StateStore — in-memory thread-safe (không DB)
│   │   ├── mqtt_service.py         MQTT client local — subscribe, parse, trigger rules
│   │   └── cloud_sync_service.py   MQTT client cloud TLS — relay state lên cloud, nhận cmd
│   ├── simple/
│   │   ├── rules_simple.py         SimpleRuleEngine + check_time_rules() (APScheduler mỗi phút)
│   │   └── device_control.py       turn_on / turn_off / toggle + batch helpers
│   ├── routes/
│   │   └── api.py                  Flask Blueprint "/api" — tất cả REST endpoints
│   ├── static/                     CSS + JS cho local dashboard
│   ├── templates/                  HTML Jinja2 (dashboard, devices, automation, settings, login)
│   └── tests/
│       ├── test_api_endpoints.py
│       └── test_state_store_basic.py
│
└── 05-CLOUD/                       ✅ DONE
    ├── BE/                         Node.js + Express + MongoDB + MQTT + Socket.io
    │   ├── src/
    │   │   ├── app.js              Express setup + route mount
    │   │   ├── server.js           HTTP + Socket.io attach + MQTT start
    │   │   ├── config/             db.js, env.js, mqtt.js
    │   │   ├── models/             User, Hub, SensorHistory, CommandLog, Rules
    │   │   ├── services/           mqttService, hubService, commandService, rulesService, socketService
    │   │   ├── routes/             auth, state, control, history, rules, hub
    │   │   ├── middleware/auth.js   JWT verify
    │   │   └── socket/index.js     Socket.io setup
    │   ├── package.json
    │   ├── .env / .env.example
    │   ├── DESIGN.md               ← Đọc đây trước khi code Cloud BE
    │   └── README.md
    └── FE/eco-smart-oasis/         React 19 / Vite / TypeScript / Tailwind
        ├── src/
        │   ├── App.tsx             Router + tab navigation
        │   ├── context/            AuthContext (JWT) + SmartHomeContext (socket + state)
        │   ├── lib/                api.ts (fetch + auto-refresh) + socket.ts (singleton)
        │   ├── components/         Dashboard, FloorTrangTret, FloorLau1, FloorSanThuong, Automations
        │   └── pages/Login.tsx
        ├── package.json
        ├── .env / .env.example
        └── README.md
```

---

## 4 Module chức năng

| Module | ESP | Chức năng | Sensor | Actuator |
|--------|-----|-----------|--------|----------|
| **1 — Tưới cây** | esp2 (rooftop) | Tự đo độ ẩm đất, bơm khi khô, dừng khi mưa | Soil Moisture (GPIO34), Rain (GPIO35) | Relay bơm (GPIO26) |
| **2 — Rèm cửa** | esp1 (bedroom) | Tự đóng/mở rèm theo ánh sáng LDR | LDR (GPIO34) | Servo SG90 (GPIO13) |
| **3 — Đèn** | esp1 (bedroom) | Bật 18:00/tắt 06:00, điều khiển từ xa | — | Relay Zone1 (GPIO26), Zone2 (GPIO27) |
| **4 — Cửa trời** | esp2 (rooftop) | Mở khi nóng (>35°C), đóng khi mưa | DHT22 (GPIO4), Rain (GPIO35) | Servo MG995 (GPIO13) |

---

## Môi trường & chạy project

```bash
# Backend Hub (Python) — chạy trên Orange Pi / máy local
cd 03-BACKEND/smart-home-hub
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # lần đầu — điền MQTT_BROKER, MQTT_USER, MQTT_PASSWORD
python main.py              # Flask port 5000

# Cloud Backend (Node.js)
cd 05-CLOUD/BE
npm install
cp .env.example .env        # lần đầu — điền MONGODB_URI, JWT_SECRET, CLOUD_MQTT_*
node src/server.js          # port 3000 (hoặc: npm run dev)

# Cloud Frontend (React/Vite)
cd 05-CLOUD/FE/eco-smart-oasis
npm install
cp .env.example .env        # VITE_API_URL + VITE_SOCKET_URL → localhost:3000
npm run dev                 # dev server port 5173

# MQTT Broker (local)
mosquitto -c /etc/mosquitto/mosquitto.conf

# Test không cần phần cứng
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/soil_moisture" -m "25"
mosquitto_pub -h localhost -t "smarthome/bedroom/sensors/light" -m "85"
mosquitto_sub -h localhost -t "smarthome/cmd/#" -v
```

---

## Stack

| Layer | Tech | Ghi chú |
|-------|------|---------|
| Firmware | C++17 / Arduino IDE 2.x | Board: ESP32 Dev Module |
| Backend Hub | Python 3.11 / Flask 3.0 / paho-mqtt / APScheduler | Không có DB — dùng StateStore in-memory |
| Cloud BE | Node.js 18+ / Express / MongoDB / mqtt.js / Socket.io | |
| Cloud FE | React 19 / Vite / TypeScript / Tailwind CSS v4 | |
| Database cloud | MongoDB Atlas | |
| MQTT local | Mosquitto 2.x (port 1883, no TLS) | |
| MQTT cloud | HiveMQ / EMQX Cloud (port 8883, TLS) | |

---

## MQTT Topics

### Local (ESP32 ↔ Hub, port 1883)

```
# ESP32 → Hub (publish)
smarthome/bedroom/sensors/light           → int 0–100 (% ánh sáng LDR)
smarthome/bedroom/sensors/curtain         → int 0–100 (% vị trí rèm)
smarthome/bedroom/sensors/light1_state    → "0" | "1"
smarthome/bedroom/sensors/light2_state    → "0" | "1"
smarthome/rooftop/sensors/soil_moisture   → int 0–100 (% độ ẩm đất)
smarthome/rooftop/sensors/pump_state      → "0" | "1"
smarthome/rooftop/sensors/temperature     → float (°C)
smarthome/rooftop/sensors/rain            → "0" | "1"
smarthome/rooftop/sensors/skylight        → "open" | "closed"

smarthome/status/{device_id}             → {"status":"online"|"offline","version":"1.0.0"}
smarthome/heartbeat/{device_id}          → {"uptime":N,"heap":N,"rssi":N}

# Hub → ESP32 (subscribe)
smarthome/cmd/bedroom/curtain            → {"position": 0–100}     ← dùng position, không phải state
smarthome/cmd/bedroom/light1             → {"state": true|false}
smarthome/cmd/bedroom/light2             → {"state": true|false}
smarthome/cmd/rooftop/pump               → {"state": true|false}
smarthome/cmd/rooftop/skylight           → {"state": true|false}
```

### Cloud (Hub ↔ Cloud BE, port 8883 TLS)

```
# Hub → Cloud Broker (publish)
cloud/{hub_id}/{location_id}/sensors/{type}  → sensor data batch mỗi 10s
cloud/{hub_id}/status                         → "online"|"offline" (retain)
cloud/{hub_id}/config                         → device layout JSON (retain)
cloud/{hub_id}/ack/{command_id}               → {"success": true}
cloud/{hub_id}/rules_ack                      → {"success": true, "timestamp": "ISO8601"}

# Cloud BE → Hub (retain=true)
cloud/{hub_id}/rules                          → rule config JSON (QoS 1)
cloud/{hub_id}/cmd/{location_id}/{actuator}   → {"state": true, "command_id": "uuid"}
```

---

## REST API — Hub (Flask, port 5000)

```
GET  /api/state                          → toàn bộ state tất cả locations
GET  /api/state/{location_id}            → state 1 location
GET  /api/state/floor/{floor}            → state theo tầng
POST /api/control/{location_id}/{actuator} → {"state": true} → gửi MQTT
GET  /api/devices                        → LOCATIONS + ESP32_DEVICES từ MY_DEVICES.py
GET  /api/rules                          → tóm tắt sensor rules + time rules
GET  /api/metrics                        → stats StateStore
GET  /api/health                         → {"status", "mqtt_connected", "state_store_ok"}
```

## REST API — Cloud BE (Node.js, port 3000)

```
POST /auth/login                         → {accessToken (15m), refreshToken (7d)}
POST /auth/refresh                       → {accessToken}
POST /auth/logout

GET  /api/state                          → snapshot tất cả locations
GET  /api/state/:locationId
POST /api/control/:locationId/:actuator  → {"state": true} → publish MQTT → chờ ack 10s
GET  /api/history?locationId=&sensorType=&hours=
GET  /api/rules                          → rule config hiện tại
PUT  /api/rules                          → lưu DB + publish xuống hub (QoS 1, retain)
GET  /api/hub/status
GET  /api/hub/devices
GET  /health
```

---

## Socket.io Events (Cloud BE → FE)

```
"state_update"   { locationId, sensorType, value, unit, timestamp }
"hub_status"     { hubId, online, lastSeen }
"command_ack"    { commandId, success, ackedAt }
"rules_synced"   { syncedAt }
```

---

## Ports & config

| Service | Port | Ghi chú |
|---------|------|---------|
| Flask Hub | 5000 | dev mode |
| Mosquitto MQTT local | 1883 | no TLS |
| Cloud BE | 3000 | Node.js |
| Cloud FE | 5173 | Vite dev server |
| Cloud MQTT Broker | 8883 | TLS |

---

## Quy ước code

### Python (Hub)
- `snake_case` cho functions và variables
- Flask Blueprint cho mỗi route group
- **Không dùng SQLAlchemy / SQLite** — Hub dùng StateStore in-memory
- Rule priority: `cloud_rules.json` > `MY_RULES.py` > default fallback hardcode

### C++ (ESP32)
- `#pragma once` thay cho include guards
- `camelCase` cho tên hàm: `readSoilMoisture()`
- `snake_case` cho biến: `last_read_time`
- Relay **active LOW**: ON = `LOW`, OFF = `HIGH`
- ADC 12-bit (0–4095), reference 3.3V
- Mỗi module có file `.h` + `.cpp` riêng

### Node.js (Cloud BE)
- Xem `05-CLOUD/BE/DESIGN.md` để biết đầy đủ schema, API, MQTT flow
- Auth: JWT accessToken (15m) + refreshToken (7d), bcrypt password
- BE chỉ relay rules và commands — không tự xử lý automation logic

### Git
- Commit message: `[scope] mô tả ngắn` — VD: `[firmware] fix DHT22 read timeout`
- Không commit: `.env`, `__pycache__/`, `node_modules/`, `cloud_rules.json`, `*.db`

---

## Những thứ CẦN LƯU Ý

- Chưa có chip thật → không hardcode IP cụ thể của device
- `cloud_rules.json` là runtime file, không commit lên git
- Hub **không có database** — toàn bộ state sống trong RAM (`StateStore`). Restart Hub = mất state (ESP32 sẽ tự publish lại sau vài giây)
- Rèm cửa dùng `{"position": N}` — KHÔNG dùng `{"state": bool}`. MQTT topic: `smarthome/cmd/bedroom/curtain`
- Cloud FE đã tích hợp REST + Socket.io thật (không còn simulation data)
- `CLOUD_ENABLED=false` trong `.env` của Hub → tắt cloud sync, chạy local hoàn toàn
