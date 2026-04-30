# Cloud Remote Control — Requirements

**Dự án:** Smart Home IoT — Nhà Thành Thị Eco-Smart Oasis  
**Phạm vi:** Cloud server cho phép điều khiển và giám sát từ xa qua internet  
**Ngày:** 2026-04-28

---

## 1. Tổng quan

### Vấn đề cần giải quyết

`smart_home_hub` hiện chỉ hoạt động trong mạng LAN nội bộ. Khi người dùng ra ngoài, không thể giám sát hay điều khiển thiết bị. Cloud server giải quyết điều này bằng cách đóng vai trò **relay trung gian** — không xử lý logic nhà thông minh, chỉ chuyển tiếp lệnh và đồng bộ trạng thái.

### Nguyên tắc thiết kế

- **Hub là não duy nhất** — mọi automation rule, ngưỡng cảm biến vẫn do hub xử lý
- **Cloud chỉ relay** — nhận state từ hub, gửi command xuống hub, hiển thị cho user
- **Hub chủ động kết nối lên cloud** — tránh vấn đề NAT/firewall (hub ở trong LAN)
- **Hub là nguồn sự thật duy nhất về device config** — cloud không tự định nghĩa thiết bị, chỉ nhận từ hub
- **MQTT xuyên suốt** — hub dùng paho-mqtt đã có sẵn, chỉ thêm client kết nối lên cloud broker

---

## 2. Kiến trúc

```
[Browser / Mobile]
       │  HTTPS REST + WebSocket
       ▼
[Cloud Server]  ←──── JWT Auth
  ├─ BE (FastAPI)
  ├─ FE (HTML/JS)
  └─ DB (PostgreSQL / SQLite)
       │
       │  paho-mqtt + TLS :8883
       ▼
[Cloud MQTT Broker]          ← HiveMQ Free / EMQX Cloud
  (topics: cloud/{hub_id}/...)
       │
       │  paho-mqtt + TLS :8883
       ▼
[Smart Home Hub]  ←── local LAN
  ├─ cloud_sync_service.py   (NEW — MQTT client riêng)
  └─ mqtt_service.py         (existing — không đổi)
       │  MQTT local :1883
       ▼
[ESP32 × 2]
```

### Luồng dữ liệu

```
# State update (Hub → Cloud)
ESP32 ──MQTT──► mqtt_service ──callback──► cloud_sync_service
                                                  │ paho-mqtt TLS
                                                  ▼
                                          Cloud MQTT Broker
                                                  │ subscribe
                                          Cloud BE ──► DB
                                                  │ WebSocket push
                                          Cloud FE (browser)

# Remote command (User → Hub)
Browser ──REST──► Cloud BE ──publish──► Cloud MQTT Broker
                                               │ subscribe
                                       cloud_sync_service
                                               │ call
                                       mqtt_service.send_command()
                                               │ MQTT local
                                          ESP32
```

---

## 3. MQTT Topics (Cloud Broker)

Dùng prefix `cloud/` để phân biệt với local broker (`smarthome/`).

```
# Hub → Cloud Broker (publish)
cloud/{hub_id}/config                        Device registry từ MY_DEVICES.py
                                             retain=True — cloud nhận dù connect muộn
cloud/{hub_id}/status                        "online" | "offline"
                                             Last Will = "offline", retain=True
cloud/{hub_id}/{location_id}/sensors/{type}  State update theo batch (mỗi 10s/location)
cloud/{hub_id}/ack/{command_id}              Xác nhận lệnh đã thực thi

# Cloud Broker → Hub (subscribe)
cloud/{hub_id}/cmd/{location_id}/{actuator}  Remote command từ user
```

### Payload chi tiết

**`cloud/{hub_id}/config`** — gửi khi hub startup/reconnect:
```json
{
  "hub_id": "smarthome-hub-001",
  "locations": {
    "bedroom": {
      "name": "Phòng Ngủ",
      "floor": "Tầng 1",
      "sensors": ["light", "curtain", "light1_state", "light2_state"],
      "actuators": {
        "light1":  "Đèn zone 1 (Relay GPIO26)",
        "light2":  "Đèn zone 2 (Relay GPIO27)",
        "curtain": "Rèm cửa (Servo GPIO13)"
      }
    },
    "rooftop": {
      "name": "Sân Thượng",
      "floor": "Sân Thượng",
      "sensors": ["soil_moisture", "pump_state", "temperature", "rain", "skylight"],
      "actuators": {
        "pump":     "Máy bơm tưới (Relay GPIO26)",
        "skylight": "Cửa sổ trời (Servo GPIO13)"
      }
    }
  },
  "version": "1.0.0",
  "timestamp": "2026-04-28T10:00:00"
}
```

**`cloud/{hub_id}/{location_id}/sensors/{type}`** — state update:
```json
{
  "value": 28.5,
  "unit": "°C",
  "timestamp": "2026-04-28T10:00:00"
}
```

**`cloud/{hub_id}/cmd/{location_id}/{actuator}`** — remote command:
```json
{
  "state": true,
  "command_id": "cmd-uuid-123",
  "issued_by": "user@email.com",
  "timestamp": "2026-04-28T10:00:00"
}
```

**`cloud/{hub_id}/ack/{command_id}`** — command ack:
```json
{
  "command_id": "cmd-uuid-123",
  "success": true,
  "timestamp": "2026-04-28T10:00:05"
}
```

---

## 4. Thành phần cần xây dựng

### 4.1 Hub Side — `cloud_sync_service.py` (NEW)

File mới trong `03-BACKEND/smart-home-hub/services/`.

**Nhiệm vụ:**
- Kết nối Cloud MQTT Broker bằng paho-mqtt + TLS (client riêng, độc lập với mqtt_service)
- Khi connect: publish `config` topic (retain=True) từ `MY_DEVICES.py`
- Đăng ký callback vào `StateStore` để nhận thông báo khi có state thay đổi
- Batch state updates theo location, publish mỗi 10 giây
- Subscribe `cloud/{hub_id}/cmd/#` → nhận command → gọi `mqtt_service.send_command()`
- Publish ack sau khi gửi command xuống local MQTT
- Last Will: `cloud/{hub_id}/status` = `"offline"`

**Interface:**
```python
class CloudSyncService:
    def init_app(self, app, state_store, mqtt_service): ...
    # Đăng ký vào state_store.add_change_listener()
    # Khi có thay đổi: buffer vào self._pending, flush mỗi 10s

    def _on_connect(self, client, userdata, flags, rc): ...
    # Publish config + status "online"

    def _on_cloud_command(self, client, userdata, msg): ...
    # Parse command → mqtt_service.send_command() → publish ack
```

**Cấu hình thêm vào `.env`:**
```
CLOUD_ENABLED=true
CLOUD_MQTT_BROKER=your-broker.hivemq.cloud
CLOUD_MQTT_PORT=8883
CLOUD_MQTT_USER=smarthome-hub
CLOUD_MQTT_PASSWORD=<password>
CLOUD_HUB_ID=smarthome-hub-001
```

**Thay đổi trên `StateStore`** — thêm observer pattern:
```python
# Thêm vào StateStore.__init__:
self._listeners = []

# Thêm method mới:
def add_change_listener(self, callback):
    self._listeners.append(callback)

# Gọi trong update_sensor() và update_actuator() sau khi cập nhật:
for cb in self._listeners:
    cb(location_id, sensor_type, value)
```

---

### 4.2 Cloud Backend (FastAPI)

**Stack:** Python 3.11 / FastAPI / SQLAlchemy / PostgreSQL (prod) hoặc SQLite (dev)

**Khởi động:** chạy 1 MQTT client subscribe cloud broker, đồng thời serve HTTP.

#### MQTT Subscriptions (Cloud BE)

```
cloud/+/config              → lưu device registry vào DB (hubs.config_json)
cloud/+/status              → cập nhật hub online/offline
cloud/+/+/sensors/+         → lưu state_snapshots + push WebSocket xuống FE
cloud/+/ack/+               → cập nhật command_log.acked_at
```

#### REST API Endpoints

```
# Auth
POST /auth/login            body: {email, password} → {access_token, refresh_token}
POST /auth/refresh          body: {refresh_token}   → {access_token}
POST /auth/logout

# State
GET  /api/state             → toàn bộ state hiện tại (từ DB snapshot)
GET  /api/state/{location_id}
GET  /api/history?location=&sensor=&hours=   → lịch sử cảm biến

# Control
POST /api/control/{location_id}/{actuator}
     body: {"state": true}
     → publish MQTT cloud/{hub_id}/cmd/{location}/{actuator}
     → trả về {command_id}
GET  /api/control/{command_id}   → kiểm tra ack

# Hub
GET  /api/hub/status        → online/offline, last_seen, config
GET  /api/hub/devices       → device registry (từ config topic)

# WebSocket (cho browser realtime)
WS   /ws/client             → push state update khi cloud BE nhận từ broker
```

---

### 4.3 Cloud Database

#### Bảng `users`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | UUID | PK |
| email | VARCHAR | unique |
| password_hash | VARCHAR | bcrypt |
| role | ENUM(admin, viewer) | admin: điều khiển, viewer: chỉ xem |
| created_at | TIMESTAMP | |

#### Bảng `hubs`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | VARCHAR | "smarthome-hub-001" |
| config_json | TEXT | Nội dung MY_DEVICES.py locations — cập nhật từ config topic |
| online | BOOLEAN | cập nhật từ status topic |
| last_seen | TIMESTAMP | cập nhật mỗi lần nhận message bất kỳ |

> `config_json` là nguồn để Cloud FE biết có những location/sensor/actuator nào. Hub luôn là nguồn sự thật — cloud chỉ lưu lại bản copy mới nhất.

#### Bảng `state_snapshots`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT | PK auto |
| hub_id | VARCHAR | FK hubs |
| location_id | VARCHAR | |
| sensor_type | VARCHAR | |
| value | FLOAT | |
| unit | VARCHAR | |
| recorded_at | TIMESTAMP | index — dùng cho chart lịch sử |

#### Bảng `command_log`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | UUID | PK = command_id |
| hub_id | VARCHAR | FK |
| location_id | VARCHAR | |
| actuator | VARCHAR | |
| state | BOOLEAN | |
| issued_by | UUID | FK users |
| issued_at | TIMESTAMP | |
| acked_at | TIMESTAMP | null nếu chưa ack |
| success | BOOLEAN | null nếu chưa ack |

---

### 4.4 Cloud Frontend

**Stack:** Vanilla HTML/CSS/JS (đồng nhất với local dashboard)

#### Các trang

| Trang | Path | Mô tả |
|-------|------|-------|
| Login | `/login` | Form email + password |
| Dashboard | `/` | Xem state live — layout render từ `hubs.config_json` |
| Devices | `/devices` | Điều khiển actuator — layout từ config |
| History | `/history` | Chart lịch sử (Chart.js) |
| Hub Status | `/hub` | Online/offline, last seen, device config |

#### Yêu cầu UX

- **Badge "Live" / "Offline"**: rõ ràng, dựa trên `hubs.online`
- **Latency**: hiển thị thời gian từ khi bấm đến khi nhận ack
- **Role-based**: `viewer` thấy nút disable
- **Realtime**: WebSocket `/ws/client` — không polling
- **Dynamic layout**: FE render location cards dựa vào `config_json`, không hardcode

---

## 5. Yêu cầu phi chức năng

| Hạng mục | Yêu cầu |
|----------|---------|
| User auth | JWT access token 15 phút + refresh token 7 ngày |
| Hub auth | MQTT username/password (TLS bắt buộc) |
| Transport hub↔cloud | MQTT over TLS port 8883 |
| Transport user↔cloud | HTTPS + WSS |
| Reconnect hub | paho-mqtt tự reconnect, publish config lại sau mỗi reconnect |
| State throttle | Batch theo location, flush mỗi 10 giây |
| Command timeout | Không ack trong 10s → `success=false` trong command_log |
| DB retention | state_snapshots: 30 ngày / command_log: 90 ngày |
| Offline hub | Cloud serve snapshot cuối, FE hiện badge "Offline" |

---

## 6. Thứ tự triển khai

```
Bước 1 — Hub side
  ├─ Thêm observer callbacks vào StateStore
  └─ cloud_sync_service.py
       • paho-mqtt client + TLS lên cloud broker
       • Publish config (retain) khi connect
       • Batch state → publish mỗi 10s
       • Subscribe cmd → gọi mqtt_service → publish ack

Bước 2 — Cloud BE (cốt lõi)
  └─ FastAPI app
       • MQTT client subscribe cloud/+/# 
       • POST /auth/login
       • GET /api/state
       • POST /api/control/{location}/{actuator}
       • WS /ws/client

Bước 3 — Cloud DB
  └─ users, hubs (+ config_json), state_snapshots, command_log

Bước 4 — Cloud FE
  └─ Login + Dashboard dynamic (render từ config_json)
  └─ Devices page + điều khiển

Bước 5 — Hoàn thiện
  └─ History chart
  └─ Hub status page
  └─ Role-based UI
  └─ Command ack timeout
```

---

## 7. Những gì KHÔNG thuộc scope này

- Automation rules trên cloud — vẫn do hub xử lý
- Notification / alert qua email/SMS — mở rộng sau
- Multi-hub UI — DB đã có `hub_id` nhưng FE chưa cần
- Mobile app native — dùng web responsive trước
