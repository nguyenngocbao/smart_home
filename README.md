# Nhà Thành Thị Eco-Smart Oasis

**Smart Home IoT — Nhà phố, Quận 9, TP. Thủ Đức**  
**Nhóm:** Trần Kim Phương · Lê Đức Ngọc | **GVHD:** TS. Nguyễn Huỳnh Duy Khang

---

## Kiến trúc tổng quan

```
[Sensors / Actuators]
        │ GPIO
        ▼
[ESP32 × 2]  ─── MQTT local :1883 ───►  [Orange Pi Zero W — Hub]
  esp1: bedroom                              Python 3.11 / Flask 3.0
    Module 2: Rèm cửa (LDR + Servo)         MQTTService + SimpleRuleEngine
    Module 3: Đèn (2 Relay)                 CloudSyncService + REST API :5000
  esp2: rooftop
    Module 1: Tưới cây (Soil + Relay bơm)          │ MQTT TLS :8883
    Module 4: Cửa trời (DHT22 + Rain + Servo)       ▼
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

## 4 Module chức năng

| Module | ESP | Sensor | Actuator | Logic tự động |
|--------|-----|--------|----------|---------------|
| **1 — Tưới cây** | esp2 rooftop | Soil Moisture (GPIO34) + Rain (GPIO35) | Relay bơm (GPIO26) | Bơm khi đất < 30%, dừng khi mưa hoặc đất > 70% |
| **2 — Rèm cửa** | esp1 bedroom | LDR (GPIO34) | Servo SG90 (GPIO13) | Đóng khi sáng > 80%, mở khi tối < 20% |
| **3 — Đèn chiếu sáng** | esp1 bedroom | — | Relay Zone1 (GPIO26), Zone2 (GPIO27) | Bật 18:00, tắt 06:00 theo lịch Hub |
| **4 — Cửa trời** | esp2 rooftop | DHT22 (GPIO4) + Rain (GPIO35) | Servo MG995 (GPIO13) | Mở khi > 35°C, đóng ngay khi mưa |

---

## Cấu trúc thư mục

```
smarthome/
├── 02-FIRMWARE/                    ✅ HOÀN THÀNH
│   ├── esp1/                       ESP32 #1 — phòng ngủ (bedroom)
│   │   ├── esp1.ino                Entry point
│   │   ├── config.h                WiFi, MQTT, GPIO pins, ngưỡng
│   │   ├── wifi_mqtt.h/.cpp        WiFi + MQTT client
│   │   ├── module2_rem.h/.cpp      Module 2: Rèm cửa (LDR + Servo)
│   │   └── module3_den.h/.cpp      Module 3: Đèn (2 Relay)
│   ├── esp2/                       ESP32 #2 — sân thượng (rooftop)
│   │   ├── esp2.ino                Entry point
│   │   ├── config.h                WiFi, MQTT, GPIO pins, ngưỡng
│   │   ├── wifi_mqtt.h/.cpp        WiFi + MQTT client
│   │   ├── module1_tuoi.h/.cpp     Module 1: Tưới cây (Soil + Relay bơm)
│   │   └── module4_cua_troi.h/.cpp Module 4: Cửa trời (DHT22 + Rain + Servo)
│   └── README.md                   Hướng dẫn firmware, GPIO, MQTT topics
│
├── 03-BACKEND/smart-home-hub/      ✅ HOÀN THÀNH
│   ├── MY_DEVICES.py               ★ Cấu hình locations + ESP32 chips
│   ├── MY_RULES.py                 ★ Automation rules (sensor + time)
│   ├── main.py                     Entry point Flask app
│   ├── services/
│   │   ├── mqtt_service.py         MQTT client local + rule engine trigger
│   │   ├── state_store.py          In-memory thread-safe state (không DB)
│   │   └── cloud_sync_service.py   MQTT client cloud TLS — relay state + nhận cmd
│   ├── simple/
│   │   ├── rules_simple.py         SimpleRuleEngine + time-based scheduler
│   │   └── device_control.py       turn_on/turn_off helpers
│   ├── routes/api.py               REST API Flask Blueprint
│   └── README.md                   Tài liệu kỹ thuật Hub
│
└── 05-CLOUD/                       ✅ HOÀN THÀNH
    ├── BE/                         Node.js + Express + MongoDB + MQTT + Socket.io
    │   ├── src/app.js              Express setup + routes
    │   ├── src/server.js           HTTP + Socket.io + MQTT start
    │   ├── src/services/           mqttService, commandService, rulesService, socketService
    │   ├── src/routes/             auth, state, control, history, rules, hub
    │   ├── src/models/             User, Hub, SensorHistory, CommandLog, Rules
    │   ├── DESIGN.md               Thiết kế đầy đủ: schema, API, MQTT flow
    │   └── README.md               Hướng dẫn Cloud BE
    └── FE/eco-smart-oasis/         React 19 / Vite / TypeScript / Tailwind
        ├── src/App.tsx             Router + tab navigation
        ├── src/context/            AuthContext + SmartHomeContext
        ├── src/components/         Dashboard, FloorTrangTret, FloorLau1, FloorSanThuong, Automations
        ├── src/lib/                api.ts (fetch + JWT refresh) + socket.ts (Socket.io)
        └── README.md               Hướng dẫn Cloud FE
```

---

## Hướng dẫn chạy

### 1. MQTT Broker (local, chạy trên máy Hub)

```bash
mosquitto -c /etc/mosquitto/mosquitto.conf
```

### 2. Backend Hub (Orange Pi / máy local)

```bash
cd 03-BACKEND/smart-home-hub
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # điền MQTT_BROKER, MQTT_USER, MQTT_PASSWORD
python main.py          # Flask :5000
```

### 3. Cloud Backend (Node.js)

```bash
cd 05-CLOUD/BE
npm install
cp .env.example .env    # điền MONGODB_URI, JWT_SECRET, CLOUD_MQTT_*
node src/server.js      # hoặc: npm run dev  → port 3000
```

### 4. Cloud Frontend (React/Vite)

```bash
cd 05-CLOUD/FE/eco-smart-oasis
npm install
cp .env.example .env    # VITE_API_URL + VITE_SOCKET_URL → localhost:3000
npm run dev             # dev server :5173
```

### 5. Firmware ESP32

1. Mở `02-FIRMWARE/esp1/` hoặc `esp2/` trong Arduino IDE
2. Sửa `config.h`: `WIFI_SSID`, `WIFI_PASSWORD`, `MQTT_BROKER`
3. Upload lên board **ESP32 Dev Module**

Xem chi tiết: [02-FIRMWARE/README.md](02-FIRMWARE/README.md)

---

## Test không cần phần cứng

```bash
# Giả lập sensor data từ ESP32
mosquitto_pub -h localhost -t "smarthome/bedroom/sensors/light"         -m "85"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/soil_moisture" -m "20"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/temperature"   -m "36.5"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain"          -m "0"

# Theo dõi lệnh Hub gửi về ESP32
mosquitto_sub -h localhost -t "smarthome/cmd/#" -v

# Kiểm tra state
curl http://localhost:5000/api/state | python -m json.tool

# Gửi lệnh thủ công
curl -X POST http://localhost:5000/api/control/bedroom/light1 \
  -H "Content-Type: application/json" -d '{"state": true}'
```

---

## Stack & Ports

| Layer | Tech | Port |
|-------|------|------|
| Firmware | C++17 / Arduino IDE | — |
| MQTT Broker local | Mosquitto 2.x | 1883 |
| Backend Hub | Python 3.11 / Flask 3.0 | 5000 |
| Cloud MQTT | HiveMQ / EMQX Cloud TLS | 8883 |
| Cloud Backend | Node.js 18+ / Express | 3000 |
| Cloud Frontend | React 19 / Vite / TypeScript | 5173 |
| Database cloud | MongoDB Atlas | — |

---

## MQTT Topics — tóm tắt

### Local (ESP32 ↔ Hub, port 1883)

```
# ESP32 → Hub
smarthome/{location_id}/sensors/{type}   — sensor data
smarthome/status/{device_id}             — online/offline
smarthome/heartbeat/{device_id}          — uptime, heap, RSSI

# Hub → ESP32
smarthome/cmd/{location_id}/{actuator}   — {"state": true}
smarthome/cmd/bedroom/curtain            — {"position": 70}
```

### Cloud (Hub ↔ Cloud BE, port 8883 TLS)

```
# Hub → Cloud
cloud/{hub_id}/{location_id}/sensors/{type}   — sensor batch mỗi 10s
cloud/{hub_id}/status                          — online/offline (retain)
cloud/{hub_id}/config                          — device layout (retain)
cloud/{hub_id}/ack/{command_id}                — command ack

# Cloud → Hub
cloud/{hub_id}/cmd/{location_id}/{actuator}    — {"state": true, "command_id": "uuid"}
cloud/{hub_id}/rules                           — rule config JSON (QoS 1, retain)
```

---

## Tài liệu chi tiết từng layer

| Layer | README |
|-------|--------|
| Firmware ESP32 | [02-FIRMWARE/README.md](02-FIRMWARE/README.md) |
| Backend Hub (Python) | [03-BACKEND/smart-home-hub/README.md](03-BACKEND/smart-home-hub/README.md) |
| Cloud Backend (Node.js) | [05-CLOUD/BE/README.md](05-CLOUD/BE/README.md) |
| Cloud Frontend (React) | [05-CLOUD/FE/eco-smart-oasis/README.md](05-CLOUD/FE/eco-smart-oasis/README.md) |
| Cloud BE Design | [05-CLOUD/BE/DESIGN.md](05-CLOUD/BE/DESIGN.md) |
