# 📌 PROJECT CONTEXT — Smart Home IoT
> File này dùng để onboard nhanh khi bắt đầu session mới.
> Đọc file này TRƯỚC khi làm bất cứ thứ gì trong dự án.

---

## 🏠 Dự án là gì?
Hệ thống Smart Home IoT cho nhà phố đô thị tại Garden Riverside Village, Quận 9, TP. Thủ Đức.
- **Tên:** Nhà Thành Thị Eco-Smart Oasis
- **Nhóm:** Lê Đức Ngọc, Trần Kim Phương
- **GVHD:** TS. Nguyễn Huỳnh Duy Khang
- **Ngân sách:** ~5–6 triệu VND (phiên bản sinh viên tối ưu)

---

## 🧱 Kiến trúc hệ thống

```
[Sensors/Actuators]
       ↕ GPIO
  [ESP32 × 2]          ← Firmware C++ (PlatformIO)
       ↕ MQTT (WiFi)
[Raspberry Pi Zero W]  ← Hub trung tâm: Python Flask + Mosquitto
       ↕ WebSocket
  [Web Dashboard]      ← Giao diện: HTML/CSS/JS (Vanilla)
       ↕ HTTP (optional)
    [Firebase]         ← Cloud remote control (sau)
```

---

## 🔧 Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Firmware | C++ / Arduino / PlatformIO |
| Hub OS | Raspberry Pi OS Lite |
| MQTT Broker | Mosquitto |
| Backend | Python 3 / Flask / Flask-SocketIO |
| Database | SQLite / SQLAlchemy |
| Frontend | HTML + CSS + Vanilla JS + Chart.js |
| Cloud | Firebase (optional, giai đoạn sau) |

---

## 📦 Hardware chính (phiên bản sinh viên)

| Thiết bị | Số lượng | Ghi chú |
|----------|----------|---------|
| Raspberry Pi Zero W | 1 | Hub trung tâm |
| ESP32 DevKit | 2 | Controller tầng trệt + tầng 1 |
| DHT22 | 2 | Nhiệt độ + độ ẩm |
| LDR | 1 | Cảm biến ánh sáng |
| Rain Sensor | 1 | Cảm biến mưa |
| Soil Moisture | 1 | Độ ẩm đất |
| Magnetic Door Sensor | 1 | Cảm biến cửa |
| 2-Ch Relay Module | 1 | Điều khiển đèn/quạt |
| Servo MG90S | 1 | Khóa cửa |

---

## 📂 Cấu trúc folder (tóm tắt)

```
smarthome/
├── 00-PLANNING/        # BOM, kiến trúc, yêu cầu, timeline
├── 01-HARDWARE/        # Datasheet, wiring, hướng dẫn lắp
├── 02-FIRMWARE/        # C++ cho ESP32 (esp32-main đã có code)
│   ├── esp32-main/     ← CÓ CODE THẬT (sensors, actuators, mqtt, main)
│   ├── esp32-floor0/   ← File rỗng, chưa làm
│   ├── esp32-floor1/   ← File rỗng, chưa làm
│   ├── esp32-rooftop/  ← File rỗng, chưa làm
│   └── libraries/SmartHomeLib/
├── 03-BACKEND/         # Python Flask trên Raspberry Pi
│   └── smart-home-hub/
│       ├── app/        ← CÓ CODE: __init__.py, config.py, models.py
│       ├── services/   ← CÓ CODE: mqtt_service.py, rule_engine.py
│       ├── routes/     ← File rỗng, chưa làm
│       ├── templates/  ← File rỗng, chưa làm
│       └── static/     ← File rỗng, chưa làm
├── 04-FRONTEND/        # Dashboard web (chưa làm)
├── 05-CLOUD/           # Firebase/AWS (chưa làm, optional)
├── 06-DOCUMENTATION/   # Tài liệu (chưa làm)
├── 07-TESTING/         # Tests (chưa làm)
├── 08-DATA/            # Database, logs (runtime)
├── 09-DEPLOYMENT/      # Docker, systemd, scripts (chưa làm)
├── 10-NOTES/           # Ghi chú cá nhân
└── 11-REPORTS/         # Báo cáo tiến độ
```

---

## ✅ Đã làm xong

- [x] Cấu trúc folder đầy đủ (~150 files/folders)
- [x] `02-FIRMWARE/esp32-main/` — code C++ hoàn chỉnh:
  - `config.h` — WiFi, MQTT, GPIO pins, timing constants
  - `sensors.cpp/h` — DHT22, LDR, rain, soil, door, current
  - `actuators.cpp/h` — relay light/fan/pump, servo door lock
  - `mqtt_handler.cpp/h` — connect, subscribe, publish, callback
  - `main.cpp` — setup(), loop(), auto-control logic
  - `platformio.ini` — build config + libraries
- [x] `03-BACKEND/smart-home-hub/app/` — Python Flask cơ bản:
  - `config.py` — cấu hình môi trường dev/prod/test
  - `models.py` — SQLAlchemy models: SensorReading, Device, ActuatorState, AutomationRule, Alert
  - `__init__.py` — Flask app factory, db init, blueprint registry
  - `requirements.txt` + `.env.example`
- [x] `03-BACKEND/smart-home-hub/services/`:
  - `mqtt_service.py` — MQTT client, subscribe, lưu DB, emit socket, check alerts
  - `rule_engine.py` — đánh giá rule sensor/time trigger → gửi lệnh

---

## 🔜 Việc cần làm tiếp theo

### Ưu tiên cao
1. **`03-BACKEND/routes/api.py`** — REST API endpoints (GET sensors, POST commands)
2. **`03-BACKEND/routes/websocket.py`** — SocketIO events
3. **`03-BACKEND/templates/`** — HTML dashboard (base + dashboard + devices)
4. **`03-BACKEND/static/`** — CSS + JS cho dashboard

### Ưu tiên trung bình
5. **`03-BACKEND/smart-home-hub/main.py`** — entry point chạy Flask
6. **`04-FRONTEND/`** — nếu tách frontend riêng (React hoặc vanilla JS)
7. **`02-FIRMWARE/esp32-floor0/`** — clone từ esp32-main, chỉnh GPIO/config
8. **`06-DOCUMENTATION/`** — API Reference, MQTT Topics, Setup Guide

### Ưu tiên thấp (sau khi core xong)
9. `09-DEPLOYMENT/` — docker-compose, systemd services
10. `05-CLOUD/` — Firebase integration
11. `07-TESTING/` — viết tests
12. `00-PLANNING/` — điền BOM.xlsx, Wiring-Diagram

---

## 🗺️ MQTT Topics (tham khảo nhanh)

```
Publish (ESP32 → Hub):
  smarthome/sensors/temperature
  smarthome/sensors/humidity
  smarthome/sensors/light
  smarthome/sensors/soil_moisture
  smarthome/sensors/rain
  smarthome/sensors/door
  smarthome/sensors/current
  smarthome/status/esp32-main
  smarthome/heartbeat/esp32-main

Subscribe (Hub → ESP32):
  smarthome/cmd/light       {"state": true/false}
  smarthome/cmd/fan         {"state": true/false}
  smarthome/cmd/irrigation  {"state": true/false}
  smarthome/cmd/door_lock   {"unlock": true/false}
  smarthome/cmd/relay/#     {"state": true/false}
```

---

## 🔑 Quy ước code

- **Python:** snake_case, Flask blueprints, SQLAlchemy ORM
- **C++:** camelCase functions, snake_case variables, `#pragma once`
- **Relay:** Active LOW (ON = `LOW`, OFF = `HIGH`)
- **ADC:** ESP32 dùng 12-bit (0–4095), 3.3V reference
- **Database:** SQLite local, file tại `08-DATA/database/smart_home.db`
- **Port:** Flask chạy port `5000`, MQTT port `1883`
