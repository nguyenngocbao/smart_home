# Kiến Trúc Hệ Thống — Smart Home IoT

**Dự án:** Nhà Thành Thị Eco-Smart Oasis, Quận 9, TP. Thủ Đức
**Nhóm:** Lê Đức Ngọc · Trần Kim Phương
**GVHD:** TS. Nguyễn Huỳnh Duy Khang

---

## Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WEB DASHBOARD                               │
│              (Vanilla HTML/CSS/JS + Chart.js)                       │
│         http://localhost:5000   ←WebSocket→   Flask-SocketIO        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP REST + WebSocket
┌──────────────────────────────▼──────────────────────────────────────┐
│                    BACKEND HUB (Orange Pi Zero W)                   │
│                    Python 3.11 / Flask 3.0                          │
│                                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────────┐   │
│  │ MQTTService │   │ StateStore   │   │ SimpleRuleEngine       │   │
│  │ (paho-mqtt) │──▶│ (in-memory)  │──▶│ MY_RULES.py            │   │
│  └──────┬──────┘   └──────────────┘   └────────────────────────┘   │
│         │                                                           │
│  ┌──────▼──────┐   ┌──────────────┐                                │
│  │ routes/api  │   │ APScheduler  │ (time_rules mỗi phút)          │
│  │ (REST API)  │   └──────────────┘                                │
│  └─────────────┘                                                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ MQTT (port 1883)
                    ┌──────────▼──────────┐
                    │  Mosquitto Broker   │
                    └──────┬──────────────┘
               ┌───────────┘      └──────────────┐
               │                                  │
┌──────────────▼───────────┐    ┌─────────────────▼───────────┐
│   ESP32 #1 (esp32-bedroom)│    │  ESP32 #2 (esp32-rooftop)   │
│   Module 2 + Module 3     │    │  Module 1 + Module 4        │
└──────────────┬────────────┘    └─────────────────┬───────────┘
               │                                    │
    ┌──────────┴────────────┐          ┌────────────┴────────────┐
    │ LDR (GPIO34)          │          │ Soil Sensor (GPIO34)    │
    │ Servo rèm (GPIO13)    │          │ Relay Bơm (GPIO26)      │
    │ Relay Đèn 1 (GPIO26)  │          │ DHT22 (GPIO4)           │
    │ Relay Đèn 2 (GPIO27)  │          │ Rain Sensor (GPIO35)    │
    └───────────────────────┘          │ Servo Cửa Trời (GPIO13) │
                                       └─────────────────────────┘
```

---

## 4 Module Chức Năng

### Module 1 — Tưới Ban Công Tự Động (esp32-rooftop)

| Thành phần | Chi tiết |
|------------|----------|
| Cảm biến   | Soil Moisture Capacitive — GPIO34 (ADC1) |
| Cơ cấu     | Relay → Máy bơm nước — GPIO26 (active LOW) |
| Logic      | Đất < 30% & không mưa → bật bơm; Đất > 70% hoặc mưa → tắt bơm |
| Tự động FW | ESP32 tự bật/tắt bơm dựa vào sensor (không cần Hub) |
| Tự động Hub| Lịch tưới 06:00 & 17:00; kiểm tra trạng thái mưa cross-module |
| MQTT pub   | `smarthome/rooftop/sensors/soil_moisture` → int % |
| MQTT pub   | `smarthome/rooftop/sensors/pump_state` → "0"/"1" |
| MQTT sub   | `smarthome/cmd/rooftop/pump` ← `{"state": true/false}` |

### Module 2 — Rèm Cửa Phòng Ngủ Thông Minh (esp32-bedroom)

| Thành phần | Chi tiết |
|------------|----------|
| Cảm biến   | LDR — GPIO34 (ADC1) |
| Cơ cấu     | Servo SG90/MG996R — GPIO13 |
| Logic      | LDR > 80% (quá chói) → đóng rèm (0°); LDR < 20% → mở rèm (90°) |
| Điều chỉnh | Dashboard gửi lệnh vị trí 0–100% tùy ý (50%, 70%, ...) |
| Tự động FW | ESP32 tự điều khiển rèm theo LDR (không cần Hub) |
| Tự động Hub| Không — Hub chỉ nhận lệnh thủ công từ Dashboard |
| MQTT pub   | `smarthome/bedroom/sensors/light` → int % |
| MQTT pub   | `smarthome/bedroom/sensors/curtain` → int % (vị trí rèm) |
| MQTT sub   | `smarthome/cmd/bedroom/curtain` ← `{"position": 0–100}` |

### Module 3 — Đèn Chiếu Sáng Từ Xa (esp32-bedroom)

| Thành phần | Chi tiết |
|------------|----------|
| Cơ cấu     | Relay đèn zone 1 — GPIO26 (active LOW) |
|            | Relay đèn zone 2 — GPIO27 (active LOW) |
| Logic      | Theo lịch server: 18:00 bật, 06:00 tắt |
| Tự động Hub| APScheduler gọi time_rules mỗi phút → bật/tắt theo giờ |
| Điều khiển | Dashboard bật/tắt thủ công bất cứ lúc nào |
| MQTT pub   | `smarthome/bedroom/sensors/light1_state` → "0"/"1" |
| MQTT pub   | `smarthome/bedroom/sensors/light2_state` → "0"/"1" |
| MQTT sub   | `smarthome/cmd/bedroom/light1` ← `{"state": true/false}` |
| MQTT sub   | `smarthome/cmd/bedroom/light2` ← `{"state": true/false}` |

### Module 4 — Cửa Sổ Trời Chống Nóng & Mưa (esp32-rooftop)

| Thành phần | Chi tiết |
|------------|----------|
| Cảm biến   | DHT22 — GPIO4 (nhiệt độ + độ ẩm không khí) |
|            | Rain Sensor Analog — GPIO35 (ADC1) |
| Cơ cấu     | Servo MG995 — GPIO13 |
| Logic      | Nhiệt độ > 35°C & không mưa → mở cửa (90°); Mưa → đóng ngay (0°) |
|            | Nhiệt độ < 30°C → đóng cửa (đủ mát) |
| Tự động FW | ESP32 tự mở/đóng cửa trời dựa vào temp + rain (ưu tiên mưa) |
| Tự động Hub| Không — Hub chỉ nhận lệnh thủ công từ Dashboard |
| MQTT pub   | `smarthome/rooftop/sensors/temperature` → float °C |
| MQTT pub   | `smarthome/rooftop/sensors/rain` → "0"/"1" |
| MQTT pub   | `smarthome/rooftop/sensors/skylight` → "open"/"closed" |
| MQTT sub   | `smarthome/cmd/rooftop/skylight` ← `{"state": true/false}` |

---

## MQTT Topics — Bảng Tổng Hợp

### ESP32 → Hub (PUBLISH)

| Topic | Payload | Module | Ghi chú |
|-------|---------|--------|---------|
| `smarthome/bedroom/sensors/light` | int `0–100` | 2 | Độ sáng LDR (%) |
| `smarthome/bedroom/sensors/curtain` | int `0–100` | 2 | Vị trí rèm (%) |
| `smarthome/bedroom/sensors/light1_state` | `"0"` / `"1"` | 3 | Trạng thái đèn zone 1 |
| `smarthome/bedroom/sensors/light2_state` | `"0"` / `"1"` | 3 | Trạng thái đèn zone 2 |
| `smarthome/rooftop/sensors/soil_moisture` | int `0–100` | 1 | Độ ẩm đất (%) |
| `smarthome/rooftop/sensors/pump_state` | `"0"` / `"1"` | 1 | Trạng thái bơm |
| `smarthome/rooftop/sensors/temperature` | float `°C` | 4 | Nhiệt độ không khí |
| `smarthome/rooftop/sensors/rain` | `"0"` / `"1"` | 4 | Đang mưa |
| `smarthome/rooftop/sensors/skylight` | `"open"` / `"closed"` | 4 | Trạng thái cửa trời |
| `smarthome/status/esp32-bedroom` | JSON | — | `{"status":"online","version":"1.0.0"}` |
| `smarthome/status/esp32-rooftop` | JSON | — | `{"status":"online","version":"1.0.0"}` |
| `smarthome/heartbeat/esp32-bedroom` | JSON | — | `{"uptime":N,"heap":N,"rssi":N}` |
| `smarthome/heartbeat/esp32-rooftop` | JSON | — | `{"uptime":N,"heap":N,"rssi":N}` |

### Hub → ESP32 (SUBSCRIBE)

| Topic | Payload | Module | Ghi chú |
|-------|---------|--------|---------|
| `smarthome/cmd/bedroom/light1` | `{"state": true/false}` | 3 | Bật/tắt đèn zone 1 |
| `smarthome/cmd/bedroom/light2` | `{"state": true/false}` | 3 | Bật/tắt đèn zone 2 |
| `smarthome/cmd/bedroom/curtain` | `{"position": 0–100}` | 2 | Vị trí rèm (%) |
| `smarthome/cmd/rooftop/pump` | `{"state": true/false}` | 1 | Bật/tắt bơm |
| `smarthome/cmd/rooftop/skylight` | `{"state": true/false}` | 4 | Mở/đóng cửa trời |

---

## Backend — Cấu Trúc File

```
03-BACKEND/smart-home-hub/
│
├── MY_DEVICES.py     ★ Khai báo locations + ESP32 chips (SỬA ĐỂ THÊM THIẾT BỊ)
├── MY_RULES.py       ★ Automation rules — sensor & time (SỬA ĐỂ THÊM RULE)
│
├── app/
│   ├── __init__.py   Flask factory + Blueprint registry
│   ├── config.py     Dev/Prod/Test config
│   └── models.py     SQLAlchemy models (SensorReading, Device, v.v.)
│
├── services/
│   ├── mqtt_service.py   MQTT client, parse topic, gọi rule engine
│   └── state_store.py    In-memory thread-safe state (sensors + actuators)
│
├── simple/
│   ├── device_control.py  turn_on/turn_off/toggle + bulk controls
│   └── rules_simple.py    SimpleRuleEngine — gọi MY_RULES.py
│
├── routes/
│   └── api.py         REST API endpoints
│
├── templates/         HTML dashboard
├── static/            CSS + JS
└── main.py            Entry point (Flask + APScheduler)
```

---

## Luồng Dữ Liệu

### Sensor → Auto Action

```
ESP32 đọc sensor
    → MQTT publish "smarthome/{location}/sensors/{type}"
    → Hub MQTTService._on_message()
    → _process_message() → _save_sensor_reading()
    → StateStore.update_sensor()
    → SimpleRuleEngine.check_sensor_rules()
    → MY_RULES.sensor_rules()
    → turn_on/turn_off() → mqtt_service.send_command()
    → MQTT publish "smarthome/cmd/{location}/{actuator}"
    → ESP32 nhận lệnh → thực thi relay/servo
```

### Time Rule → Auto Action

```
APScheduler gọi check_time_rules() mỗi phút
    → MY_RULES.time_rules()
    → turn_on/turn_off() → mqtt_service.send_command()
    → MQTT publish "smarthome/cmd/{location}/{actuator}"
    → ESP32 nhận lệnh → thực thi
```

### Dashboard → Manual Control

```
User click Dashboard
    → REST API POST /api/devices/{location}/command
    → mqtt_service.send_command(location, actuator, state)
    → MQTT publish "smarthome/cmd/{location}/{actuator}"
    → ESP32 nhận lệnh → thực thi
```

---

## Phân Chia Trách Nhiệm

**Triết lý: Hub là não — mọi quyết định logic nằm ở hub.**
Firmware chỉ là I/O node: đọc sensor → publish, nhận lệnh → thực thi cơ cấu.
Auto-control cục bộ trong firmware là **fallback** khi mất WiFi/MQTT, không phải luồng chính.

| Module | Hub (MY_RULES.py) — luồng chính | Firmware — fallback offline |
|--------|----------------------------------|-----------------------------|
| 1 Tưới | soil_moisture → bật/tắt bơm; lịch 06:00 + 17:00; rain → tắt bơm | soil_moisture → bật/tắt bơm cục bộ |
| 2 Rèm  | light LDR → send_curtain_position(0 hoặc 100); Dashboard → vị trí tùy ý | LDR → kéo rèm cục bộ |
| 3 Đèn  | Lịch 18:00 bật, 06:00 tắt; Dashboard bật/tắt thủ công | Không có logic cục bộ |
| 4 Cửa Trời | temperature → mở/đóng; rain (cross-module) → đóng ngay | temp + rain → mở/đóng cục bộ |

---

## Cấu Hình Hệ Thống

| Service | Port | Ghi chú |
|---------|------|---------|
| Flask / Dashboard | 5000 | Dev mode |
| Mosquitto MQTT | 1883 | No TLS (local) |
| SocketIO | 5000 | Path `/socket.io` |

### Timing Firmware

| Sự kiện | Chu kỳ |
|---------|--------|
| Đọc sensor + auto control | 5 giây |
| Gửi MQTT (publish) | 10 giây |
| Heartbeat | 30 giây |
| Thử kết nối lại MQTT | 5 giây |

---

## Mock Test (Không Cần Phần Cứng)

```bash
# Giả lập Module 1 — đất khô, không mưa → hub bật bơm
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain"          -m "0"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/soil_moisture" -m "20"

# Giả lập Module 2 — ánh sáng phòng ngủ
mosquitto_pub -h localhost -t "smarthome/bedroom/sensors/light"   -m "90"
mosquitto_pub -h localhost -t "smarthome/bedroom/sensors/curtain" -m "0"

# Giả lập Module 4 — trời nóng
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/temperature" -m "37.5"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain"        -m "0"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/skylight"    -m "open"

# Giả lập mưa → hub tắt bơm ngay
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain" -m "1"

# Xem lệnh hub gửi xuống ESP32
mosquitto_sub -h localhost -t "smarthome/cmd/#" -v
```

---

## Trạng Thái Hiện Tại

| Layer | Trạng thái | Ghi chú |
|-------|-----------|---------|
| Firmware ESP1 (bedroom) | ✅ DONE | Module 2 + Module 3 hoàn thiện |
| Firmware ESP2 (rooftop) | ✅ DONE | Module 1 + Module 4 hoàn thiện |
| Backend Core | ✅ DONE | MQTTService, StateStore, SimpleRuleEngine |
| MY_DEVICES.py | ✅ DONE | Khớp firmware |
| MY_RULES.py | ✅ DONE | Khớp firmware |
| REST API | ⬜ TODO | routes/api.py |
| Dashboard HTML | ⬜ TODO | templates/ |
| Frontend JS | ⬜ TODO | static/js/ |
