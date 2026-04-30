# 03-BACKEND — Smart Home Hub

**Nhóm:** Lê Đức Ngọc · Trần Kim Phương | **GVHD:** TS. Nguyễn Huỳnh Duy Khang  
**Trạng thái:** ✅ HOÀN THÀNH | **Runtime:** Python 3.11 / Flask 3.0 | **Port:** 5000

> Đây là nguồn sự thật duy nhất của backend Hub. Đọc file này trước khi sửa bất cứ thứ gì.

---

## Mục lục

1. [Kiến trúc & luồng dữ liệu](#1-kiến-trúc--luồng-dữ-liệu)
2. [Bản đồ file](#2-bản-đồ-file)
3. [Thiết bị & khu vực (MY_DEVICES.py)](#3-thiết-bị--khu-vực)
4. [Automation Rules (MY_RULES.py)](#4-automation-rules)
5. [Hàm điều khiển có sẵn](#5-hàm-điều-khiển-có-sẵn)
6. [REST API](#6-rest-api)
7. [MQTT Topics](#7-mqtt-topics)
8. [Cloud Sync](#8-cloud-sync)
9. [Setup & chạy](#9-setup--chạy)
10. [Test không cần phần cứng](#10-test-không-cần-phần-cứng)

---

## 1. Kiến trúc & luồng dữ liệu

```
ESP32 (firmware)
    │  publish MQTT: smarthome/{location_id}/sensors/{type}
    ▼
MQTTService  (services/mqtt_service.py)
    │  parse topic → location_id + sensor_type + value
    ├─► StateStore.update_sensor(location_id, sensor_type, value, unit)
    └─► SimpleRuleEngine.check_sensor_rules(sensor_type, value, location_id)
                │
                └─► MY_RULES.sensor_rules(mqtt, state_store, location_id, sensor_type, value, cfg)
                        └─► turn_on/turn_off → mqtt.send_command(location_id, actuator, state)
                                                    ├─► StateStore.update_actuator(...)
                                                    └─► publish MQTT: smarthome/cmd/{location_id}/{actuator}

StateStore.add_change_listener(cloud_sync._on_state_change)
    └─► CloudSyncService batch flush mỗi 10s → cloud/{hub_id}/{location_id}/sensors/{type}

APScheduler (mỗi phút)
    └─► MY_RULES.time_rules(mqtt_service, state_store, cfg)

Dashboard (browser) / Cloud FE
    │  GET /api/state  (polling hoặc từ FE)
    └─► POST /api/control/{location_id}/{actuator} → mqtt.send_command(...)
```

**Không có database.** Mọi trạng thái sống trong RAM (`StateStore`). Dashboard dùng REST polling.

---

## 2. Bản đồ file

```
smart-home-hub/
│
├── MY_DEVICES.py         ★ SỬA ĐÂY khi thêm/xóa phòng hoặc chip ESP32
├── MY_RULES.py           ★ SỬA ĐÂY khi thêm/sửa automation rules
│
├── main.py               Entry point — khởi tạo StateStore, MQTT, Cloud Sync, Scheduler, API
├── .env                  Biến môi trường (không commit)
├── .env.example          Template .env
├── requirements.txt      Python dependencies
├── cloud_rules.json      Rules sync từ cloud (ưu tiên hơn MY_RULES.py) — không commit
├── default_rules.json    Fallback rules nếu cloud_rules.json chưa có
│
├── app/
│   ├── __init__.py       Flask app factory + CORS + serve templates
│   ├── config.py         Đọc .env → class Config (dev/prod/test)
│   └── models.py         Alert model (in-memory, không DB)
│
├── services/
│   ├── state_store.py    StateStore — lưu sensor/actuator state thread-safe in-memory
│   ├── mqtt_service.py   MQTT client local — subscribe, parse, gọi StateStore + RuleEngine
│   └── cloud_sync_service.py  MQTT client cloud — relay state lên cloud, nhận cmd từ cloud
│
├── simple/
│   ├── rules_simple.py   SimpleRuleEngine + check_time_rules()
│   └── device_control.py Hàm tiện ích: turn_on/turn_off/toggle + hàm batch
│
├── routes/
│   └── api.py            Flask Blueprint "/api" — REST endpoints
│
├── static/               CSS + JS cho local dashboard
├── templates/            HTML Jinja2 (dashboard, devices, automation, settings, login)
│
└── tests/
    ├── test_api_endpoints.py
    └── test_state_store_basic.py
```

### Quy tắc: khi nào sửa file nào

| Muốn làm gì | Sửa file |
|------------|---------|
| Thêm phòng / khu vực mới | `MY_DEVICES.py` → `LOCATIONS` |
| Thêm chip ESP32 mới | `MY_DEVICES.py` → `ESP32_DEVICES` |
| Thêm/sửa rule tự động | `MY_RULES.py` |
| Thêm REST endpoint | `routes/api.py` |
| Đổi MQTT broker / port / password | `.env` |
| Thay đổi ngưỡng rule (nhiệt độ, độ ẩm...) | `cloud_rules.json` hoặc `default_rules.json` |
| Sửa logic parse MQTT topic | `services/mqtt_service.py` |
| Thêm hàm điều khiển batch | `simple/device_control.py` |

---

## 3. Thiết bị & khu vực

Dự án sử dụng 2 location và 2 ESP32 chip (thực tế phần cứng hiện có):

### LOCATIONS

| `location_id` | Tên | Tầng | Sensors | Actuators |
|--------------|-----|------|---------|-----------|
| `bedroom` | Phòng Ngủ | Tầng 1 | light, curtain, light1_state, light2_state | curtain (position), light1, light2 |
| `rooftop` | Sân Thượng | Sân Thượng | soil_moisture, pump_state, temperature, rain, skylight | pump, skylight |

### ESP32_DEVICES

| `device_id` | Tên | Quản lý |
|------------|-----|--------|
| `esp32-bedroom` | ESP32 Phòng Ngủ | bedroom |
| `esp32-rooftop` | ESP32 Sân Thượng | rooftop |

> **Lưu ý:** `location_id` phải khớp với segment thứ 2 trong MQTT topic: `smarthome/{location_id}/sensors/{type}`

---

## 4. Automation Rules

**File cần sửa: `MY_RULES.py`**  
Rule parameters (ngưỡng, lịch): `cloud_rules.json` → `default_rules.json` → fallback hardcode.

### sensor_rules — chạy mỗi khi nhận sensor data

```python
def sensor_rules(mqtt, state_store, location_id, sensor_type, value, cfg):
    # cfg = dict đọc từ cloud_rules.json / default_rules.json
    
    # Ví dụ: tưới cây theo độ ẩm
    if sensor_type == "soil_moisture" and location_id == "rooftop":
        ws = cfg.get("wateringSensor", {})
        rain = state_store.get_sensor("rooftop", "rain")
        is_raining = rain and rain["value"] == 1.0
        if value < ws.get("dryThreshold", 30) and not is_raining:
            turn_on(mqtt, "rooftop", "pump", state_store)
        elif value > ws.get("wetThreshold", 70):
            turn_off(mqtt, "rooftop", "pump", state_store)
```

### time_rules — chạy mỗi phút (APScheduler)

```python
def time_rules(mqtt, state_store, cfg):
    now = datetime.now()
    hour, minute = now.hour, now.minute
    
    # Lịch đèn: bật 18:00, tắt 06:00
    ls = cfg.get("lightingSchedule", {})
    if ls.get("enabled"):
        on_h, on_m = map(int, ls["onTime"].split(":"))
        if hour == on_h and minute == on_m:
            turn_on(mqtt, "bedroom", "light1", state_store)
            turn_on(mqtt, "bedroom", "light2", state_store)
```

### Rule priority

```
cloud_rules.json (sync từ cloud)  >  MY_RULES.py  >  default fallback
```

---

## 5. Hàm điều khiển có sẵn

Import từ `simple/device_control.py`:

```python
from simple.device_control import (
    turn_on, turn_off,           # (mqtt, location_id, actuator, state_store=None)
    toggle, get_state,           # toggle đảo, get_state đọc bool/None

    # Batch theo phòng
    turn_on_all_lights,   turn_off_all_lights,
    turn_on_all_fans,     turn_off_all_fans,

    # Batch theo tầng (floor: "Tầng Trệt" | "Tầng 1" | "Sân Thượng" | "Ngoài Trời")
    turn_on_all_lights_on_floor,  turn_off_all_lights_on_floor,
    turn_on_all_fans_on_floor,    turn_off_all_fans_on_floor,

    # Toàn nhà
    turn_on_all_lights_in_house,  turn_off_all_lights_in_house,
)
```

> `turn_on` / `turn_off` validate location và actuator trước khi gửi lệnh. Sai tên → log error, return False, không crash.

**Đặc biệt cho rèm cửa** (dùng `position` thay vì `state`):
```python
mqtt_service.send_curtain_position(70)   # mở 70% — topic: smarthome/cmd/bedroom/curtain
```

---

## 6. REST API

Base URL: `http://localhost:5000/api`

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/state` | Toàn bộ state tất cả location |
| GET | `/state/{location_id}` | State 1 location |
| GET | `/state/floor/{floor}` | State theo tầng |
| POST | `/control/{location_id}/{actuator}` | Bật/tắt actuator |
| GET | `/devices` | Danh sách locations + ESP32 (từ MY_DEVICES.py) |
| GET | `/rules` | Tóm tắt sensor rules + time rules |
| GET | `/metrics` | Thống kê StateStore |
| GET | `/health` | Health check (MQTT status + StateStore) |

**Request body `/api/control`:**
```json
{"state": true}
```

**Response `/api/state`:**
```json
{
  "locations": {
    "bedroom": {
      "sensors": {"light": {"value": 75.0, "unit": "%", "timestamp": "..."}},
      "actuators": {"light1": {"state": true, "value": "on", "updated_by": "rule", "timestamp": "..."}}
    }
  },
  "timestamp": "2026-04-29T10:30:05"
}
```

---

## 7. MQTT Topics

### ESP32 → Hub (subscribe)
```
smarthome/+/sensors/#          — sensor data của mọi device
smarthome/status/#              — online/offline của chip
smarthome/heartbeat/#           — uptime, heap, RSSI
```

### Hub → ESP32 (publish)
```
smarthome/cmd/{location_id}/{actuator}
payload: {"state": true, "source": "hub", "timestamp": "..."}

# Rèm cửa đặc biệt:
smarthome/cmd/bedroom/curtain
payload: {"position": 70, "source": "hub", "timestamp": "..."}
```

---

## 8. Cloud Sync

`services/cloud_sync_service.py` — MQTT client riêng, kết nối Cloud Broker qua TLS port 8883.

**Bật cloud sync:** đặt `CLOUD_ENABLED=true` trong `.env` và điền đủ `CLOUD_MQTT_*` variables.

Khi bật:
- **Publish state lên cloud** (batch mỗi 10 giây): `cloud/{hub_id}/{location_id}/sensors/{type}`
- **Nhận command từ cloud**: `cloud/{hub_id}/cmd/{location_id}/{actuator}` → relay xuống ESP32
- **Nhận rules từ cloud**: `cloud/{hub_id}/rules` → lưu `cloud_rules.json` + reload rule engine
- **Publish ack**: `cloud/{hub_id}/ack/{command_id}` và `cloud/{hub_id}/rules_ack`
- **Last Will**: topic `cloud/{hub_id}/status` payload `"offline"` khi mất kết nối

---

## 9. Setup & chạy

```bash
# Lần đầu
cd 03-BACKEND/smart-home-hub
python -m venv .venv
source .venv/bin/activate     # Mac/Linux | .venv\Scripts\activate (Windows)
pip install -r requirements.txt
cp .env.example .env          # điền MQTT_BROKER, MQTT_USER, MQTT_PASSWORD
```

**File `.env` cần thiết lập:**
```ini
FLASK_ENV=development
PORT=5000

MQTT_BROKER=localhost          # IP của Orange Pi hoặc localhost khi dev
MQTT_PORT=1883
MQTT_USER=smarthome
MQTT_PASSWORD=mqtt_password

# Cloud sync (tắt khi dev local)
CLOUD_ENABLED=false
CLOUD_MQTT_BROKER=xxx.hivemq.cloud
CLOUD_MQTT_PORT=8883
CLOUD_MQTT_USER=
CLOUD_MQTT_PASSWORD=
CLOUD_HUB_ID=smarthome-hub-001
```

**Chạy server:**
```bash
python main.py
```

Output mong đợi:
```
✅ State Store initialized
✅ MQTT Service initialized with State Store
✅ Simple Rule Engine initialized
✅ API Blueprint registered
✅ Time-based rules scheduler started
🏠 Smart Home Hub running at http://localhost:5000
```

**Deploy lên Orange Pi Zero W:**
```bash
# Copy code lên Orange Pi
scp -r smart-home-hub/ user@orangepi.local:~/
ssh user@orangepi.local
cd smart-home-hub && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env

# Chạy tự động khi boot (systemd)
sudo nano /etc/systemd/system/smarthome-hub.service
```

```ini
[Unit]
Description=Smart Home Hub
After=network.target mosquitto.service

[Service]
User=pi
WorkingDirectory=/home/pi/smart-home-hub
ExecStart=/home/pi/smart-home-hub/.venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable smarthome-hub && sudo systemctl start smarthome-hub
```

---

## 10. Test không cần phần cứng

```bash
# Biến ngắn gọn
M="-h localhost -u smarthome -P mqtt_password"

# Giả lập sensor data
mosquitto_pub $M -t "smarthome/bedroom/sensors/light"         -m "85"
mosquitto_pub $M -t "smarthome/bedroom/sensors/curtain"       -m "50"
mosquitto_pub $M -t "smarthome/rooftop/sensors/soil_moisture" -m "20"
mosquitto_pub $M -t "smarthome/rooftop/sensors/temperature"   -m "36.5"
mosquitto_pub $M -t "smarthome/rooftop/sensors/rain"          -m "0"

# Giả lập heartbeat
mosquitto_pub $M -t "smarthome/status/esp32-bedroom" \
  -m '{"status":"online","version":"1.0.0"}'

# Theo dõi lệnh rule engine gửi
mosquitto_sub $M -t "smarthome/cmd/#" -v

# Kiểm tra state qua API
curl http://localhost:5000/api/state | python -m json.tool
curl http://localhost:5000/api/state/bedroom
curl http://localhost:5000/api/health

# Gửi lệnh thủ công
curl -X POST http://localhost:5000/api/control/bedroom/light1 \
  -H "Content-Type: application/json" -d '{"state": true}'

# Chạy tests
pytest tests/ -v
```

---

## Phụ lục — Sensor types

| `sensor_type` | Đơn vị | MQTT payload | Ghi chú |
|--------------|--------|--------------|---------|
| `temperature` | °C | `"28.5"` | float |
| `humidity` | % | `"65"` | float |
| `light` | % | `"75"` | float |
| `soil_moisture` | % | `"25"` | float |
| `curtain` | % | `"50"` | float — vị trí rèm |
| `rain` | — | `"0"` hoặc `"1"` | hub convert: 1.0 = mưa |
| `pump_state` | — | `"0"` hoặc `"1"` | trạng thái bơm |
| `skylight` | — | `"open"` hoặc `"closed"` | hub convert: 1.0 = mở |
| `light1_state` | — | `"0"` hoặc `"1"` | trạng thái đèn zone 1 |
| `light2_state` | — | `"0"` hoặc `"1"` | trạng thái đèn zone 2 |
