# TỔNG QUAN DỰ ÁN — NHÀ THÀNH THỊ ECO-SMART OASIS

**Nhóm:** Lê Đức Ngọc · Trần Kim Phương  
**GVHD:** TS. Nguyễn Huỳnh Duy Khang  
**Địa điểm:** Quận 9, TP. Thủ Đức

---

## 1. MỤC TIÊU

Hệ thống Smart Home IoT cho nhà phố, giải quyết 3 vấn đề thực tiễn:

| Vấn đề | Giải pháp |
|--------|-----------|
| Nhà ngột ngạt, hầm nóng | Cửa sổ trời tự mở thoát nhiệt, đóng ngay khi mưa |
| Bật/tắt đèn bất tiện nhiều tầng | Quản lý tập trung qua Dashboard, điều khiển từ xa |
| Không có thời gian chăm cây | Hệ thống tự đo độ ẩm đất và tưới tự động theo lịch |

---

## 2. KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB DASHBOARD                            │
│              (Vanilla HTML/CSS/JS + Chart.js)                   │
│                  http://<hub-ip>:5000                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP REST (polling 2s)
┌────────────────────────────▼────────────────────────────────────┐
│                  BACKEND HUB — Orange Pi Zero W                 │
│                   Python 3.11 / Flask 3.0                       │
│                                                                 │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────────────┐ │
│  │ MQTTService │─▶│ StateStore │─▶│ SimpleRuleEngine         │ │
│  │ (paho-mqtt) │  │ (in-memory)│  │ MY_RULES.py              │ │
│  └──────┬──────┘  └────────────┘  └──────────────────────────┘ │
│         │                                                       │
│  ┌──────▼──────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  routes/api │  │ APScheduler  │  │ cloud_sync_service  │   │
│  │  REST API   │  │ (mỗi phút)   │  │ (optional)          │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ MQTT port 1883
                  ┌──────────▼──────────┐
                  │   Mosquitto Broker   │
                  └─────┬───────────────┘
              ┌─────────┘         └──────────────┐
              │                                   │
┌─────────────▼──────────────┐  ┌────────────────▼────────────┐
│  ESP32 #1 — esp32-bedroom  │  │  ESP32 #2 — esp32-rooftop   │
│  Tầng 1 / Phòng ngủ        │  │  Sân thượng                 │
│                            │  │                             │
│  Module 2: Rèm cửa         │  │  Module 1: Tưới cây         │
│    LDR      → GPIO34       │  │    Soil sensor → GPIO34     │
│    Servo    → GPIO13       │  │    Relay bơm  → GPIO26      │
│                            │  │                             │
│  Module 3: Đèn chiếu sáng  │  │  Module 4: Cửa sổ trời      │
│    Relay 1  → GPIO26       │  │    DHT11      → GPIO4       │
│    Relay 2  → GPIO27       │  │    Rain sensor→ GPIO35      │
└────────────────────────────┘  │    Servo      → GPIO13      │
                                └─────────────────────────────┘
```

**Triết lý thiết kế:** Hub là "não" — mọi quyết định logic tập trung tại đây. Firmware ESP32 chỉ là I/O node: đọc sensor → publish, nhận lệnh → thực thi. Auto-control trong firmware là **fallback** khi mất WiFi/MQTT.

---

## 3. BỐN MODULE CHỨC NĂNG

### Module 1 — Tưới Ban Công Tự Động
**ESP32 #2 (rooftop) · Sân thượng**

| Thành phần | Chi tiết |
|-----------|----------|
| Cảm biến độ ẩm đất | Capacitive Soil Moisture — GPIO34 |
| Relay bơm | 5V active LOW — GPIO26 |
| Ngưỡng bật bơm | Đất < 30% & không mưa |
| Ngưỡng tắt bơm | Đất > 70% hoặc phát hiện mưa |
| Lịch tưới Hub | 06:00 bật → 06:30 tắt · 17:00 bật → 17:30 tắt |
| Cross-module | Mưa (Module 4) → tắt bơm ngay lập tức |

### Module 2 — Rèm Cửa Phòng Ngủ Thông Minh
**ESP32 #1 (bedroom) · Tầng 1**

| Thành phần | Chi tiết |
|-----------|----------|
| Cảm biến ánh sáng | LDR + R10kΩ — GPIO34 |
| Servo rèm | SG90 / MG996R — GPIO13 |
| Ngưỡng đóng rèm | Ánh sáng > 80% (quá chói) → servo 0° |
| Ngưỡng mở rèm | Ánh sáng < 20% (quá tối) → servo 90° |
| Điều khiển thủ công | Dashboard gửi vị trí 0–100% tùy ý |

### Module 3 — Đèn Chiếu Sáng Từ Xa
**ESP32 #1 (bedroom) · Tầng 1**

| Thành phần | Chi tiết |
|-----------|----------|
| Relay Zone 1 | 5V active LOW — GPIO26 |
| Relay Zone 2 | 5V active LOW — GPIO27 |
| Lịch ngày thường | 18:00 bật · 06:00 tắt |
| Lịch cuối tuần | 17:30 bật · 06:00 tắt |
| Điều khiển thủ công | Dashboard bật/tắt từng zone bất cứ lúc nào |

### Module 4 — Cửa Sổ Trời Chống Nóng & Mưa
**ESP32 #2 (rooftop) · Sân thượng**

| Thành phần | Chi tiết |
|-----------|----------|
| Cảm biến nhiệt độ | DHT11 — GPIO4 |
| Cảm biến mưa | Rain Sensor Analog — GPIO35 |
| Servo cửa trời | MG995 — GPIO13 |
| Ngưỡng mở cửa | Nhiệt độ > 35°C & không mưa → servo 90° |
| Ngưỡng đóng cửa | Nhiệt độ < 30°C hoặc phát hiện mưa → servo 0° |
| Ưu tiên | Mưa luôn đóng cửa ngay — bất kể nhiệt độ |

---

## 4. AUTOMATION RULES (MY_RULES.py)

### Sensor Rules — chạy mỗi khi nhận dữ liệu mới từ ESP32

| Sensor | Điều kiện | Hành động |
|--------|-----------|-----------|
| `bedroom/light` | > 80% | Đóng rèm (position 0) |
| `bedroom/light` | < 20% | Mở rèm (position 100) |
| `rooftop/soil_moisture` | < 30% & không mưa | Bật bơm |
| `rooftop/soil_moisture` | > 70% hoặc đang mưa | Tắt bơm |
| `rooftop/temperature` | > 35°C & không mưa | Mở cửa sổ trời |
| `rooftop/temperature` | < 30°C | Đóng cửa sổ trời |
| `rooftop/rain` | == 1 (có mưa) | **Cross-module:** Tắt bơm + Đóng cửa trời |

### Time Rules — APScheduler chạy mỗi phút

| Thời gian | Ngày | Hành động |
|-----------|------|-----------|
| 06:00 | Hàng ngày | Tắt đèn phòng ngủ |
| 06:00 | Hàng ngày | Bật bơm (nếu không mưa) |
| 06:30 | Hàng ngày | Tắt bơm buổi sáng |
| 17:00 | Hàng ngày | Bật bơm chiều (nếu không mưa) |
| 17:30 | Hàng ngày | Tắt bơm buổi chiều |
| 17:30 | Cuối tuần (T7, CN) | Bật đèn phòng ngủ sớm |
| 18:00 | Hàng ngày | Bật đèn phòng ngủ |

---

## 5. REST API

Backend đã hoàn thiện tại `http://<hub-ip>:5000`:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/state` | Toàn bộ state sensors + actuators |
| GET | `/api/state/<location_id>` | State của 1 khu vực |
| GET | `/api/state/floor/<floor>` | State theo tầng |
| POST | `/api/control/<location_id>/<actuator>` | Gửi lệnh điều khiển |
| GET | `/api/devices` | Danh sách ESP32 + locations |
| GET | `/api/rules` | Danh sách automation rules |
| GET | `/api/metrics` | Performance metrics |
| GET | `/api/health` | Trạng thái MQTT + StateStore |

**Ví dụ điều khiển:**
```bash
# Bật đèn Zone 1
curl -X POST http://localhost:5000/api/control/bedroom/light1 \
     -H "Content-Type: application/json" \
     -d '{"state": true}'

# Chỉnh rèm 50%
curl -X POST http://localhost:5000/api/control/bedroom/curtain \
     -H "Content-Type: application/json" \
     -d '{"position": 50}'

# Bật bơm thủ công
curl -X POST http://localhost:5000/api/control/rooftop/pump \
     -H "Content-Type: application/json" \
     -d '{"state": true}'
```

---

## 6. MQTT TOPICS

### ESP32 → Hub (Publish)

| Topic | Payload | Module |
|-------|---------|--------|
| `smarthome/bedroom/sensors/light` | int 0–100 | 2 |
| `smarthome/bedroom/sensors/curtain` | int 0–100 | 2 |
| `smarthome/bedroom/sensors/light1_state` | "0"/"1" | 3 |
| `smarthome/bedroom/sensors/light2_state` | "0"/"1" | 3 |
| `smarthome/rooftop/sensors/soil_moisture` | int 0–100 | 1 |
| `smarthome/rooftop/sensors/pump_state` | "0"/"1" | 1 |
| `smarthome/rooftop/sensors/temperature` | float °C | 4 |
| `smarthome/rooftop/sensors/rain` | "0"/"1" | 4 |
| `smarthome/rooftop/sensors/skylight` | "open"/"closed" | 4 |
| `smarthome/status/esp32-bedroom` | JSON | — |
| `smarthome/status/esp32-rooftop` | JSON | — |
| `smarthome/heartbeat/esp32-bedroom` | JSON | — |
| `smarthome/heartbeat/esp32-rooftop` | JSON | — |

### Hub → ESP32 (Subscribe)

| Topic | Payload | Module |
|-------|---------|--------|
| `smarthome/cmd/bedroom/light1` | `{"state": true/false}` | 3 |
| `smarthome/cmd/bedroom/light2` | `{"state": true/false}` | 3 |
| `smarthome/cmd/bedroom/curtain` | `{"position": 0–100}` | 2 |
| `smarthome/cmd/rooftop/pump` | `{"state": true/false}` | 1 |
| `smarthome/cmd/rooftop/skylight` | `{"state": true/false}` | 4 |

---

## 7. CLOUD SYNC (cloud_sync_service.py)

Hệ thống hỗ trợ đồng bộ lên Cloud MQTT Broker (HiveMQ / EMQX) qua **TLS port 8883**. Tính năng này **tùy chọn** — bật/tắt qua biến môi trường.

### Chức năng

| Chức năng | Mô tả |
|-----------|-------|
| **Relay state lên cloud** | Batch dữ liệu sensor + actuator, flush mỗi **10 giây** |
| **Nhận command từ cloud** | Điều khiển thiết bị từ xa qua Internet |
| **Đồng bộ rules** | Cập nhật automation rules từ cloud xuống hub |
| **Publish config** | Gửi cấu hình MY_DEVICES.py lên cloud (retain=True) |
| **Last Will** | Broker tự publish "offline" khi hub mất kết nối |

### Cloud MQTT Topics

| Topic | Hướng | Mô tả |
|-------|-------|-------|
| `cloud/{hub_id}/status` | Hub → Cloud | "online" / "offline" (retain) |
| `cloud/{hub_id}/config` | Hub → Cloud | Cấu hình devices (retain) |
| `cloud/{hub_id}/{location}/sensors/{type}` | Hub → Cloud | Dữ liệu sensor batch |
| `cloud/{hub_id}/cmd/{location}/{actuator}` | Cloud → Hub | Lệnh điều khiển |
| `cloud/{hub_id}/ack/{command_id}` | Hub → Cloud | Xác nhận lệnh |
| `cloud/{hub_id}/rules` | Cloud → Hub | Cập nhật automation rules |
| `cloud/{hub_id}/rules_ack` | Hub → Cloud | Xác nhận nhận rules |

### Bật Cloud Sync

Thêm vào file `.env`:
```env
CLOUD_ENABLED=true
CLOUD_HUB_ID=smarthome-hub-001
CLOUD_MQTT_BROKER=your-broker.hivemq.cloud
CLOUD_MQTT_PORT=8883
CLOUD_MQTT_USER=your_username
CLOUD_MQTT_PASSWORD=your_password
```

---

## 9. CẤU TRÚC THƯ MỤC

```
02-FIRMWARE/
  esp1/              ESP32 #1 — phòng ngủ
    config.h         WiFi, MQTT, GPIO, ngưỡng tự động
    module2_rem.*    Module 2: Rèm thông minh
    module3_den.*    Module 3: Đèn chiếu sáng
    wifi_mqtt.*      Kết nối WiFi + MQTT
  esp2/              ESP32 #2 — sân thượng
    config.h         WiFi, MQTT, GPIO, ngưỡng tự động
    module1_tuoi.*   Module 1: Tưới tự động
    module4_cua_troi.* Module 4: Cửa sổ trời
    wifi_mqtt.*      Kết nối WiFi + MQTT

03-BACKEND/smart-home-hub/
  MY_DEVICES.py      ★ Khai báo locations + ESP32 chips
  MY_RULES.py        ★ Automation rules (sensor + time)
  main.py            Entry point (Flask + APScheduler)
  app/               Flask factory, config, models
  services/
    mqtt_service.py  MQTT client + parse topic
    state_store.py   In-memory thread-safe state
    cloud_sync_service.py  Cloud sync (optional)
  simple/
    device_control.py  turn_on/turn_off/toggle
    rules_simple.py    SimpleRuleEngine
  routes/
    api.py           REST API endpoints (đã hoàn thiện)
  templates/         HTML dashboard (TODO)
  static/            CSS + JS (TODO)
```

---

## 10. TRẠNG THÁI HIỆN TẠI

| Component | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Firmware ESP32 #1 (bedroom) | ✅ Hoàn thành | Module 2 + 3 |
| Firmware ESP32 #2 (rooftop) | ✅ Hoàn thành | Module 1 + 4 |
| Backend: MQTTService + StateStore | ✅ Hoàn thành | |
| Backend: SimpleRuleEngine + MY_RULES | ✅ Hoàn thành | Gồm cross-module rule |
| Backend: REST API | ✅ Hoàn thành | 8 endpoints |
| Backend: Cloud Sync | ✅ Tích hợp | Optional, bật qua `CLOUD_ENABLED=true` |
| Frontend: Dashboard HTML/CSS/JS | ⬜ Chưa làm | |

---

## 11. TIMING

| Sự kiện | Chu kỳ |
|---------|--------|
| ESP32 đọc sensor + auto control | 5 giây |
| ESP32 gửi MQTT publish | 10 giây |
| ESP32 gửi heartbeat | 30 giây |
| ESP32 thử kết nối lại MQTT | 5 giây |
| Hub chạy time rules | 1 phút |
| Dashboard polling `/api/state` | 2 giây |

---

*Cập nhật lần cuối: 28/04/2026 — phản ánh code thực tế firmware + backend*
