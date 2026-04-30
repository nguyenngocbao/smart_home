# BÁO CÁO TỔNG HỢP DỰ ÁN
# NHÀ THÀNH THỊ ECO-SMART OASIS

**Nhóm thực hiện:** Lê Đức Ngọc · Trần Kim Phương  
**Giảng viên hướng dẫn:** TS. Nguyễn Huỳnh Duy Khang  
**Địa điểm triển khai:** Quận 9, TP. Thủ Đức  

---

## 1. MỤC TIÊU DỰ ÁN

Ngôi nhà được thiết kế theo kiểu nhà phố hiện đại, ứng dụng công nghệ Smart Home (IoT) để giải quyết 3 vấn đề thực tiễn của đời sống đô thị:

| # | Vấn đề | Giải pháp |
|---|--------|-----------|
| 1 | Nhà ngột ngạt, hầm nóng do "hiệu ứng đảo nhiệt" | Hệ thống thông gió tự động — cửa sổ trời tự mở khi nóng, đóng khi mưa |
| 2 | Bất tiện bật/tắt thiết bị điện ở nhiều tầng | Quản lý đèn tập trung qua Dashboard, điều khiển từ xa qua Internet |
| 3 | Không có thời gian chăm sóc cây cối | Hệ thống tự đo độ ẩm đất và tưới cây tự động |

---

## 2. KIẾN TRÚC HỆ THỐNG TỔNG QUAN

```
┌─────────────────────────────────────────────────────────┐
│                    WEB DASHBOARD                        │
│          (Vanilla HTML/CSS/JS + Chart.js)               │
│       http://<raspberry-pi-ip>:5000                     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST (polling 2s)
┌───────────────────────▼─────────────────────────────────┐
│             BACKEND HUB — Orange Pi Zero W              │
│                Python 3.11 / Flask 3.0                  │
│                                                         │
│  MQTTService ──► StateStore ──► SimpleRuleEngine        │
│  (paho-mqtt)     (in-memory)    (MY_RULES.py)           │
│                                 APScheduler (time rules)│
│  REST API  ◄──────────────────────────────────────────  │
└───────────────────────┬─────────────────────────────────┘
                        │ MQTT port 1883
             ┌──────────▼──────────┐
             │   Mosquitto Broker  │
             └────┬────────────────┘
          ┌───────┘          └──────────────┐
          │                                 │
┌─────────▼────────────┐    ┌───────────────▼──────────┐
│  ESP32 #1 — bedroom  │    │  ESP32 #2 — rooftop      │
│  Module 2 + Module 3 │    │  Module 1 + Module 4     │
└──────────────────────┘    └──────────────────────────┘
```

### Phân tầng trách nhiệm

| Tầng | Vai trò |
|------|---------|
| **Firmware ESP32** | I/O node: đọc sensor → publish MQTT; nhận lệnh → thực thi relay/servo. Có fallback tự động khi mất WiFi. |
| **Backend Hub** | "Não" hệ thống: nhận dữ liệu sensor, đánh giá rules, gửi lệnh điều khiển, phục vụ Dashboard. |
| **Web Dashboard** | Giao diện giám sát và điều khiển thủ công từ xa. |

### Thông số kỹ thuật

| Service | Port | Ghi chú |
|---------|------|---------|
| Flask / Dashboard | 5000 | Dev mode |
| Mosquitto MQTT | 1883 | No TLS (local network) |
| SQLite DB | — | `08-DATA/database/smart_home.db` |

---

## 3. BỐN MODULE CHỨC NĂNG

---

### MODULE 1 — HỆ THỐNG TƯỚI BAN CÔNG TỰ ĐỘNG
*Smart Irrigation Node | ESP32 #2 (rooftop)*

#### Mô tả
Cảm biến độ ẩm đất liên tục theo dõi trạng thái đất trồng tại ban công. Khi đất quá khô và trời không mưa, hệ thống tự động kích hoạt máy bơm. Toàn bộ lịch sử tưới được đẩy lên Hub để chủ nhà theo dõi.

#### Thành phần phần cứng

| Linh kiện | Model | Kết nối GPIO |
|-----------|-------|-------------|
| Vi điều khiển | ESP32 DevKit V1 | — |
| Cảm biến độ ẩm đất | Capacitive Soil Moisture v1.2 | GPIO34 (ADC1_CH6) |
| Module Relay | 5V 1-channel, active LOW | GPIO26 |
| Máy bơm nước | Mini DC 3–6V submersible pump | Qua Relay |
| Nguồn | 5V/2A USB adapter | VIN + GND |

#### Sơ đồ lắp đặt

```
                    ESP32 DevKit V1
                   ┌──────────────┐
            3.3V ──┤ 3V3      GND ├── GND ──────────── GND (chung)
             GND ──┤ GND      VIN ├── 5V
                   │              │
 Soil Sensor AOUT──┤ GPIO34   GPIO26 ├── IN (Relay Module)
                   │              │
                   └──────────────┘

Soil Moisture Sensor (Capacitive):
  VCC  ──── 3.3V (ESP32)
  GND  ──── GND
  AOUT ──── GPIO34

Relay Module (active LOW):
  VCC  ──── 5V
  GND  ──── GND
  IN   ──── GPIO26
  COM  ──── (+) nguồn 5V máy bơm
  NO   ──── (+) dây dương máy bơm
  [Máy bơm: (-) nối GND]
```

```
WIRING DIAGRAM — MODULE 1

   3.3V ─────────┬──────────── VCC (Soil Sensor)
                 │
   GND  ─────────┼──────────── GND (Soil Sensor)
                 │             GND (Relay)
                 │             GND (-)  Bơm
   GPIO34 ───────┤──────────── AOUT (Soil Sensor)
                 │
   GPIO26 ───────┤──────────── IN   (Relay)
                 │
   5V    ─────────┼──────────── VCC  (Relay)
                 │             COM  (Relay) ──── (+) 5V nguồn bơm
                 │             NO   (Relay) ──── (+) Bơm

   [Relay đóng tiếp điểm COM–NO khi GPIO26 = LOW]
```

#### Logic hoạt động

```
Mỗi 5 giây:
  đọc soil_moisture (%)
  
  IF soil_moisture < 30% AND rain == 0:
      bật bơm (GPIO26 = LOW)
  ELSE IF soil_moisture > 70% OR rain == 1:
      tắt bơm (GPIO26 = HIGH)

Hub override (MY_RULES.py):
  Lịch: 06:00 → bật bơm (nếu đất khô)
         17:00 → bật bơm (nếu đất khô)
  Cross-check: nếu Module 4 báo mưa → tắt bơm ngay
```

#### MQTT Topics

| Hướng | Topic | Payload | Mô tả |
|-------|-------|---------|-------|
| Publish | `smarthome/rooftop/sensors/soil_moisture` | `int 0–100` | Độ ẩm đất (%) |
| Publish | `smarthome/rooftop/sensors/pump_state` | `"0"` / `"1"` | Trạng thái bơm |
| Subscribe | `smarthome/cmd/rooftop/pump` | `{"state": true/false}` | Lệnh bật/tắt bơm từ Hub |

---

### MODULE 2 — RÈM CỬA PHÒNG NGỦ THÔNG MINH
*Smart Shading Control | ESP32 #1 (bedroom)*

#### Mô tả
Cảm biến ánh sáng LDR đo độ chói trong phòng ngủ. Khi ánh sáng quá mạnh, servo tự động kéo rèm đóng lại. Chủ nhà có thể dùng Dashboard để chỉnh vị trí rèm tùy ý từ 0% đến 100%.

#### Thành phần phần cứng

| Linh kiện | Model | Kết nối GPIO |
|-----------|-------|-------------|
| Vi điều khiển | ESP32 DevKit V1 | — |
| Cảm biến ánh sáng | LDR + Điện trở 10kΩ (voltage divider) | GPIO34 (ADC1_CH6) |
| Servo motor | SG90 hoặc MG996R | GPIO13 (PWM) |
| Nguồn | 5V/2A USB adapter | VIN + GND |

#### Sơ đồ lắp đặt

```
WIRING DIAGRAM — MODULE 2

   3.3V ─────────┬──────────── Một đầu LDR
                 │
   GPIO34 ────── ┼──────────── Điểm giữa (LDR + R10k)
                 │
   GND  ─────────┼──────────── R10k (đầu còn lại) ──── GND
                 │
   GPIO13 ───────┤──────────── Signal (Servo — dây cam/vàng)
                 │
   5V    ─────────┼──────────── VCC (Servo — dây đỏ)
                 │
   GND  ─────────┘──────────── GND (Servo — dây nâu/đen)

LDR Voltage Divider:
  3.3V → [LDR] → GPIO34 → [R 10kΩ] → GND
  ADC đọc điện áp tại điểm giữa: sáng → điện áp cao

Servo SG90/MG996R:
  Dây đỏ   → 5V
  Dây nâu  → GND
  Dây cam  → GPIO13 (PWM 50Hz)
  0°   = Rèm đóng hoàn toàn
  90°  = Rèm mở hoàn toàn
```

#### Logic hoạt động

```
Mỗi 5 giây:
  đọc light_level (%)
  
  IF light_level > 80%:  // quá chói
      đặt rèm về 0° (đóng hoàn toàn)
  ELSE IF light_level < 20%:  // tối
      đặt rèm về 90° (mở hoàn toàn)
  // Khoảng 20–80%: giữ nguyên vị trí hiện tại

Dashboard override:
  Gửi lệnh position 0–100% → map sang góc 0°–90°
  Ví dụ: 50% → servo 45°, 70% → servo 63°
```

#### MQTT Topics

| Hướng | Topic | Payload | Mô tả |
|-------|-------|---------|-------|
| Publish | `smarthome/bedroom/sensors/light` | `int 0–100` | Độ sáng LDR (%) |
| Publish | `smarthome/bedroom/sensors/curtain` | `int 0–100` | Vị trí rèm (%) |
| Subscribe | `smarthome/cmd/bedroom/curtain` | `{"position": 0–100}` | Lệnh chỉnh vị trí rèm từ Hub |

---

### MODULE 3 — QUẢN LÝ ĐÈN CHIẾU SÁNG TỪ XA
*Scheduling & Remote Lighting | ESP32 #1 (bedroom)*

#### Mô tả
Toàn bộ hệ thống đèn (2 zone) được quản lý tập trung qua MQTT. Hub tự động bật đèn lúc 18:00 và tắt lúc 06:00. Bất cứ lúc nào chủ nhà cũng có thể bật/tắt thủ công qua Dashboard.

#### Thành phần phần cứng

| Linh kiện | Model | Kết nối GPIO |
|-----------|-------|-------------|
| Vi điều khiển | ESP32 DevKit V1 | — |
| Relay đèn Zone 1 | 5V 1-channel, active LOW | GPIO26 |
| Relay đèn Zone 2 | 5V 1-channel, active LOW | GPIO27 |
| Đèn Zone 1 | Bóng LED 220V (qua relay) | — |
| Đèn Zone 2 | Bóng LED 220V (qua relay) | — |
| Nguồn | 5V/2A USB cho ESP32 + relay | VIN + GND |

#### Sơ đồ lắp đặt

```
WIRING DIAGRAM — MODULE 3

   ESP32 DevKit V1
   ┌──────────────────────┐
   │ GPIO26 ──────────────┼─── IN1 (Relay Zone 1)
   │ GPIO27 ──────────────┼─── IN2 (Relay Zone 2)
   │ 5V     ──────────────┼─── VCC (Relay board)
   │ GND    ──────────────┼─── GND (Relay board)
   └──────────────────────┘

Relay Zone 1 (GPIO26):
  COM ──── Dây Phase 220V (nguồn)
  NO  ──── Dây Phase vào đèn Zone 1
  [Neutral 220V nối thẳng vào đèn]
  GPIO26 = LOW  → Relay đóng → Đèn BẬT
  GPIO26 = HIGH → Relay mở  → Đèn TẮT

Relay Zone 2 (GPIO27): tương tự cho đèn Zone 2

⚠️ CẢNH BÁO AN TOÀN ĐIỆN:
  - Đảm bảo cách điện tốt tại các mối nối 220V
  - Dùng hộp đấu dây (terminal box) cách điện
  - Không để tay chạm vào khi có nguồn 220V
```

#### Logic hoạt động

```
Hub — APScheduler (chạy mỗi phút):
  IF giờ hiện tại == 18:00:
      bật đèn Zone 1 + Zone 2 (GPIO26 = LOW, GPIO27 = LOW)
  IF giờ hiện tại == 06:00:
      tắt đèn Zone 1 + Zone 2 (GPIO26 = HIGH, GPIO27 = HIGH)

Dashboard:
  Bật/tắt từng zone độc lập bất cứ lúc nào
  
Firmware không có logic cục bộ cho Module 3
→ Chỉ nhận lệnh từ Hub và thực thi
```

#### MQTT Topics

| Hướng | Topic | Payload | Mô tả |
|-------|-------|---------|-------|
| Publish | `smarthome/bedroom/sensors/light1_state` | `"0"` / `"1"` | Trạng thái đèn Zone 1 |
| Publish | `smarthome/bedroom/sensors/light2_state` | `"0"` / `"1"` | Trạng thái đèn Zone 2 |
| Subscribe | `smarthome/cmd/bedroom/light1` | `{"state": true/false}` | Lệnh bật/tắt đèn Zone 1 |
| Subscribe | `smarthome/cmd/bedroom/light2` | `{"state": true/false}` | Lệnh bật/tắt đèn Zone 2 |

---

### MODULE 4 — CỬA SỔ TRỜI CHỐNG NÓNG & MƯA
*Anti-Heat & Rain Defense Skylight | ESP32 #2 (rooftop)*

#### Mô tả
Hệ thống phối hợp cảm biến nhiệt độ DHT22 và cảm biến mưa. Khi trời nóng quá 35°C, cửa sổ trời tự mở để thoát nhiệt. Chỉ cần phát hiện mưa, cửa lập tức đóng lại — ưu tiên mưa hơn nhiệt độ — bảo vệ nội thất tuyệt đối.

#### Thành phần phần cứng

| Linh kiện | Model | Kết nối GPIO |
|-----------|-------|-------------|
| Vi điều khiển | ESP32 DevKit V1 | — |
| Cảm biến nhiệt độ/ẩm | DHT22 (AM2302) | GPIO4 |
| Cảm biến mưa | Rain Sensor Analog Module | GPIO35 (ADC1_CH7) |
| Servo cửa trời | MG995 (high torque) | GPIO13 (PWM) |
| Điện trở pull-up | 10kΩ | GPIO4 → 3.3V |
| Nguồn | 5V/2A | VIN + GND |

#### Sơ đồ lắp đặt

```
WIRING DIAGRAM — MODULE 4

   ESP32 DevKit V1
   ┌──────────────────────────┐
   │ 3.3V ────┬───────────────┼─── VCC (DHT22)
   │          └── R10kΩ ──────┼─── DATA (DHT22) ── GPIO4
   │ GPIO4 ───────────────────┤
   │ GPIO35 ──────────────────┼─── AOUT (Rain Sensor)
   │ GPIO13 ──────────────────┼─── Signal (Servo MG995)
   │ 5V ──────────────────────┼─── VCC (Rain Sensor)
   │                          │    VCC (Servo MG995 — dây đỏ)
   │ GND ─────────────────────┼─── GND (DHT22)
   │                          │    GND (Rain Sensor)
   │                          │    GND (Servo — dây đen)
   └──────────────────────────┘

DHT22:
  Pin 1 (VCC)  → 3.3V
  Pin 2 (DATA) → GPIO4 + R10kΩ pull-up lên 3.3V
  Pin 3 (NC)   → bỏ trống
  Pin 4 (GND)  → GND

Rain Sensor Module:
  VCC  → 5V
  GND  → GND
  AO   → GPIO35   (giá trị analog: khô=cao, mưa=thấp)
  DO   → không dùng (dùng AO để có độ nhạy hơn)

Servo MG995 (cửa trời):
  Dây đỏ   → 5V
  Dây đen  → GND
  Dây vàng → GPIO13
  0°  = Cửa ĐÓNG
  90° = Cửa MỞ hoàn toàn (thoát nhiệt)
```

#### Logic hoạt động

```
Mỗi 5 giây:
  đọc temperature (°C) từ DHT22
  đọc rain (0/1) từ Rain Sensor

  // Ưu tiên mưa — đóng ngay lập tức
  IF rain == 1:
      đóng cửa (servo 0°) — BẤT KỂ nhiệt độ

  ELSE IF temperature > 35°C:
      mở cửa (servo 90°)   // thoát nhiệt

  ELSE IF temperature < 30°C:
      đóng cửa (servo 0°)  // đủ mát rồi
  
  // 30–35°C và không mưa: giữ nguyên trạng thái

Hub cross-module rule (MY_RULES.py):
  Khi rooftop/sensors/rain = "1"
  → Gửi lệnh đóng cửa trời
  → Đồng thời tắt bơm tưới (Module 1)
```

#### MQTT Topics

| Hướng | Topic | Payload | Mô tả |
|-------|-------|---------|-------|
| Publish | `smarthome/rooftop/sensors/temperature` | `float °C` | Nhiệt độ không khí |
| Publish | `smarthome/rooftop/sensors/rain` | `"0"` / `"1"` | Phát hiện mưa |
| Publish | `smarthome/rooftop/sensors/skylight` | `"open"` / `"closed"` | Trạng thái cửa trời |
| Subscribe | `smarthome/cmd/rooftop/skylight` | `{"state": true/false}` | Lệnh mở/đóng thủ công |

---

## 4. BẢNG MQTT TOPICS TỔNG HỢP

### ESP32 → Hub (PUBLISH)

| Topic | Payload | Module | Thiết bị |
|-------|---------|--------|---------|
| `smarthome/bedroom/sensors/light` | `int 0–100` | 2 | ESP32 #1 |
| `smarthome/bedroom/sensors/curtain` | `int 0–100` | 2 | ESP32 #1 |
| `smarthome/bedroom/sensors/light1_state` | `"0"/"1"` | 3 | ESP32 #1 |
| `smarthome/bedroom/sensors/light2_state` | `"0"/"1"` | 3 | ESP32 #1 |
| `smarthome/rooftop/sensors/soil_moisture` | `int 0–100` | 1 | ESP32 #2 |
| `smarthome/rooftop/sensors/pump_state` | `"0"/"1"` | 1 | ESP32 #2 |
| `smarthome/rooftop/sensors/temperature` | `float °C` | 4 | ESP32 #2 |
| `smarthome/rooftop/sensors/rain` | `"0"/"1"` | 4 | ESP32 #2 |
| `smarthome/rooftop/sensors/skylight` | `"open"/"closed"` | 4 | ESP32 #2 |
| `smarthome/status/esp32-bedroom` | `JSON` | — | Heartbeat |
| `smarthome/status/esp32-rooftop` | `JSON` | — | Heartbeat |

### Hub → ESP32 (SUBSCRIBE)

| Topic | Payload | Module | Thiết bị |
|-------|---------|--------|---------|
| `smarthome/cmd/bedroom/curtain` | `{"position": 0–100}` | 2 | ESP32 #1 |
| `smarthome/cmd/bedroom/light1` | `{"state": true/false}` | 3 | ESP32 #1 |
| `smarthome/cmd/bedroom/light2` | `{"state": true/false}` | 3 | ESP32 #1 |
| `smarthome/cmd/rooftop/pump` | `{"state": true/false}` | 1 | ESP32 #2 |
| `smarthome/cmd/rooftop/skylight` | `{"state": true/false}` | 4 | ESP32 #2 |

---

## 5. LUỒNG DỮ LIỆU

### 5.1 Sensor → Hành động tự động

```
ESP32 đọc sensor (mỗi 5s)
  └─► MQTT Publish "smarthome/{location}/sensors/{type}"
        └─► Hub: MQTTService._on_message()
              └─► StateStore.update_sensor()
              └─► SimpleRuleEngine.check_sensor_rules()
                    └─► MY_RULES.sensor_rules()
                          └─► turn_on/turn_off()
                                └─► mqtt_service.send_command()
                                      └─► MQTT Publish "smarthome/cmd/{location}/{actuator}"
                                            └─► ESP32 nhận lệnh → thực thi relay/servo
```

### 5.2 Rule theo thời gian

```
APScheduler (mỗi phút)
  └─► MY_RULES.time_rules()
        └─► Kiểm tra giờ hiện tại
              └─► turn_on/turn_off()
                    └─► MQTT Publish lệnh → ESP32 thực thi
```

### 5.3 Dashboard → Điều khiển thủ công

```
User click Dashboard
  └─► REST API: POST /api/control/{location}/{actuator}
        └─► StateStore.update_actuator()
        └─► mqtt_service.send_command()
              └─► MQTT Publish lệnh → ESP32 thực thi
```

---

## 6. PHÂN CHIA MODULE THEO ESP32

### ESP32 #1 — esp32-bedroom (Tầng 1 — Phòng ngủ & Ban công)

| Module | Sensor | Actuator | GPIO |
|--------|--------|----------|------|
| Module 2 — Rèm | LDR | Servo SG90/MG996R | GPIO34 (in), GPIO13 (out) |
| Module 3 — Đèn | — | Relay Zone 1, Zone 2 | GPIO26, GPIO27 (out) |

### ESP32 #2 — esp32-rooftop (Sân thượng)

| Module | Sensor | Actuator | GPIO |
|--------|--------|----------|------|
| Module 1 — Tưới | Soil Moisture | Relay → Bơm | GPIO34 (in), GPIO26 (out) |
| Module 4 — Cửa trời | DHT22, Rain Sensor | Servo MG995 | GPIO4, GPIO35 (in), GPIO13 (out) |

---

## 7. TIMING & CHU KỲ HOẠT ĐỘNG

| Sự kiện | Chu kỳ | Ghi chú |
|---------|--------|---------|
| Đọc sensor + auto control (Firmware) | 5 giây | Vòng lặp chính ESP32 |
| Gửi MQTT publish | 10 giây | Tránh spam broker |
| Heartbeat ESP32 | 30 giây | `uptime`, `heap`, `rssi` |
| Thử kết nối lại MQTT | 5 giây | Khi mất kết nối |
| Dashboard polling | 2 giây | REST GET /api/state |
| APScheduler time rules | 1 phút | Kiểm tra lịch tưới, đèn |

---

## 8. TRẠNG THÁI TRIỂN KHAI HIỆN TẠI

| Layer | File/Component | Trạng thái |
|-------|---------------|-----------|
| **Firmware** | esp32-bedroom (Module 2 + 3) | ✅ HOÀN THÀNH |
| **Firmware** | esp32-rooftop (Module 1 + 4) | ✅ HOÀN THÀNH |
| **Backend** | MQTTService | ✅ HOÀN THÀNH |
| **Backend** | StateStore (in-memory) | ✅ HOÀN THÀNH |
| **Backend** | SimpleRuleEngine + MY_RULES.py | ✅ HOÀN THÀNH |
| **Backend** | MY_DEVICES.py | ✅ HOÀN THÀNH |
| **Backend** | REST API (routes/api.py) | ⬜ CẦN HOÀN THIỆN |
| **Frontend** | Dashboard HTML + CSS + JS | ⬜ CẦN HOÀN THIỆN |

---

## 9. HƯỚNG DẪN TEST KHÔNG CẦN PHẦN CỨNG

Khi chưa có chip ESP32 thật, dùng MQTT mock để kiểm tra Hub và Dashboard:

```bash
# Giả lập Module 1 — đất khô, không mưa → Hub bật bơm
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain"          -m "0"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/soil_moisture" -m "20"

# Giả lập Module 2 — phòng quá sáng → Hub đóng rèm
mosquitto_pub -h localhost -t "smarthome/bedroom/sensors/light"   -m "90"

# Giả lập Module 4 — trời nóng → Hub mở cửa trời
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/temperature" -m "37.5"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain"        -m "0"

# Giả lập mưa → Hub đóng cửa trời + tắt bơm ngay
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain" -m "1"

# Xem lệnh Hub gửi xuống ESP32
mosquitto_sub -h localhost -t "smarthome/cmd/#" -v
```

---

## 10. GHI CHÚ KỸ THUẬT QUAN TRỌNG

- **Relay active LOW:** `LOW` = BẬT thiết bị, `HIGH` = TẮT thiết bị. Khởi động ESP32 phải set `HIGH` trước để tránh relay tự kích.
- **ADC ESP32:** 12-bit (0–4095), điện áp tham chiếu 3.3V. Các chân ADC2 (GPIO0, 2, 4, 12–15, 25–27) không dùng khi WiFi đang hoạt động — chỉ dùng ADC1 (GPIO32–39).
- **DHT22:** Cần điện trở pull-up 10kΩ từ DATA lên 3.3V. Không đọc quá 1 lần/2 giây.
- **Servo PWM:** 50Hz, duty cycle 2.5%–12.5% tương ứng 0°–180°. Dùng `ledcWrite()` với LEDC trên ESP32.
- **Hub triết lý:** Hub là "não", firmware là "tay chân". Mọi quyết định logic phức tạp nằm ở Hub. Firmware chỉ fallback khi mất WiFi/MQTT.
- **Cross-module rule:** Cảm biến mưa (Module 4) ảnh hưởng đến cả Module 1 (tắt bơm) — chỉ Hub mới có thể thực hiện logic cross-module này vì cùng xem toàn bộ StateStore.

---

## 11. SƠ ĐỒ LẮP ĐẶT THIẾT BỊ TRONG NHÀ

Sơ đồ thể hiện **vị trí vật lý** của từng thiết bị phần cứng (cảm biến, cơ cấu chấp hành, bộ điều khiển) tại các tầng trong ngôi nhà.

```
╔══════════════════════════════════════════════════════════════════════╗
║                          SÂN THƯỢNG                                 ║
║                                                                      ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  [Cửa sổ trời / Skylight]                                   │   ║
║   │                                                             │   ║
║   │     ┌─────────────┐          ┌────────────────┐            │   ║
║   │     │  Servo MG995 │◄─────── │   DHT22        │            │   ║
║   │     │  (mở/đóng   │         │   Cảm biến      │            │   ║
║   │     │   cửa trời) │         │   Nhiệt độ/Ẩm  │            │   ║
║   │     └─────────────┘         │   → GPIO4       │            │   ║
║   │          │ GPIO13            └────────────────┘            │   ║
║   │          ▼                                                  │   ║
║   │     [Cơ cấu mở cửa]       ┌──────────────────┐            │   ║
║   │     0° = Đóng              │  Rain Sensor     │            │   ║
║   │     90° = Mở               │  Cảm biến mưa   │            │   ║
║   │                             │  → GPIO35        │            │   ║
║   │                             └──────────────────┘            │   ║
║   └────────────────── MODULE 4 ─────────────────────────────────┘   ║
║                                                                      ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  [Khu vực trồng cây / Ban công sân thượng]                  │   ║
║   │                                                             │   ║
║   │  ┌──────────────────┐        ┌───────────────────┐         │   ║
║   │  │  Soil Moisture   │        │  Relay Module     │         │   ║
║   │  │  Capacitive      │        │  (active LOW)     │         │   ║
║   │  │  → GPIO34        │        │  → GPIO26         │         │   ║
║   │  └──────────────────┘        └────────┬──────────┘         │   ║
║   │                                        │                    │   ║
║   │                               ┌────────▼──────────┐        │   ║
║   │                               │  Máy bơm nước     │        │   ║
║   │                               │  DC submersible   │        │   ║
║   │                               │  → Vòi tưới cây  │        │   ║
║   │                               └───────────────────┘        │   ║
║   └────────────────── MODULE 1 ─────────────────────────────────┘   ║
║                                                                      ║
║   ┌──────────────────────────────────┐                              ║
║   │  ESP32 #2  (esp32-rooftop)       │  ← đặt trong hộp điện       ║
║   │  Điều khiển Module 1 + Module 4  │    chống nước IP54          ║
║   │  Nguồn: 5V adapter               │                              ║
║   └──────────────────────────────────┘                              ║
╠══════════════════════════════════════════════════════════════════════╣
║                     TẦNG 1 — PHÒNG NGỦ & BAN CÔNG                  ║
║                                                                      ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  [Cửa sổ / Rèm cửa phòng ngủ]                              │   ║
║   │                                                             │   ║
║   │  ┌──────────────────┐        ┌───────────────────┐         │   ║
║   │  │  LDR + R10kΩ     │        │  Servo SG90       │         │   ║
║   │  │  Cảm biến ánh    │        │  (kéo rèm)        │         │   ║
║   │  │  sáng            │        │  → GPIO13         │         │   ║
║   │  │  → GPIO34        │        └────────┬──────────┘         │   ║
║   │  └──────────────────┘                 │                    │   ║
║   │                                  [Cơ cấu kéo rèm]          │   ║
║   │                                  0°  = Rèm đóng            │   ║
║   │                                  90° = Rèm mở              │   ║
║   └────────────────── MODULE 2 ─────────────────────────────────┘   ║
║                                                                      ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  [Hệ thống chiếu sáng phòng ngủ]                           │   ║
║   │                                                             │   ║
║   │   ┌──────────────────────┐   ┌──────────────────────┐      │   ║
║   │   │  Relay Zone 1        │   │  Relay Zone 2        │      │   ║
║   │   │  (active LOW)        │   │  (active LOW)        │      │   ║
║   │   │  → GPIO26            │   │  → GPIO27            │      │   ║
║   │   └──────────┬───────────┘   └──────────┬───────────┘      │   ║
║   │              │                           │                  │   ║
║   │         [Đèn LED               [Đèn LED                    │   ║
║   │          Zone 1 / 220V]         Zone 2 / 220V]             │   ║
║   │                                                             │   ║
║   │  ⚠️  Relay nối vào dây Phase 220V — cách điện trong        │   ║
║   │      hộp terminal, không để hở khi có nguồn               │   ║
║   └────────────────── MODULE 3 ─────────────────────────────────┘   ║
║                                                                      ║
║   ┌──────────────────────────────────┐                              ║
║   │  ESP32 #1  (esp32-bedroom)       │  ← gắn trên tường hoặc      ║
║   │  Điều khiển Module 2 + Module 3  │    trong tủ điện tầng 1     ║
║   │  Nguồn: 5V adapter               │                              ║
║   └──────────────────────────────────┘                              ║
╠══════════════════════════════════════════════════════════════════════╣
║                     TẦNG TRỆT — PHÒNG KHÁCH / KHO KỸ THUẬT         ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────┐      ║
║   │  Orange Pi Zero W  (Backend Hub)                         │      ║
║   │  Nguồn: 5V/2A micro-USB                                  │      ║
║   │  Kết nối: WiFi (cùng mạng LAN với 2 ESP32)              │      ║
║   └──────────────────────────────────────────────────────────┘      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 12. BẢNG TỔNG HỢP THIẾT BỊ TOÀN NHÀ

| # | Thiết bị | Loại | Vị trí | Kết nối với | GPIO |
|---|---------|------|--------|-------------|------|
| 1 | ESP32 DevKit V1 | Vi điều khiển | Sân thượng (hộp điện) | Soil Sensor, Rain Sensor, DHT22, Relay bơm, Servo cửa trời | — |
| 2 | ESP32 DevKit V1 | Vi điều khiển | Tầng 1 (tủ điện) | LDR, Servo rèm, Relay đèn ×2 | — |
| 3 | Soil Moisture Capacitive v1.2 | Cảm biến | Sân thượng — chậu cây | ESP32 #2 | GPIO34 |
| 4 | DHT22 (AM2302) | Cảm biến | Sân thượng — ngoài trời | ESP32 #2 | GPIO4 |
| 5 | Rain Sensor Analog | Cảm biến | Sân thượng — ngoài trời | ESP32 #2 | GPIO35 |
| 6 | LDR + R10kΩ | Cảm biến | Tầng 1 — cửa sổ phòng ngủ | ESP32 #1 | GPIO34 |
| 7 | Servo MG995 | Cơ cấu | Sân thượng — khung cửa trời | ESP32 #2 | GPIO13 |
| 8 | Servo SG90 / MG996R | Cơ cấu | Tầng 1 — thanh trượt rèm | ESP32 #1 | GPIO13 |
| 9 | Relay Module 5V | Cơ cấu | Sân thượng — gần máy bơm | ESP32 #2 | GPIO26 |
| 10 | Relay Module 5V | Cơ cấu | Tầng 1 — hộp điện Zone 1 | ESP32 #1 | GPIO26 |
| 11 | Relay Module 5V | Cơ cấu | Tầng 1 — hộp điện Zone 2 | ESP32 #1 | GPIO27 |
| 12 | Máy bơm DC submersible | Cơ cấu | Sân thượng — thùng nước | Relay #9 | — |
| 13 | Đèn LED 220V — Zone 1 | Tải | Tầng 1 — trần phòng ngủ | Relay #10 | — |
| 14 | Đèn LED 220V — Zone 2 | Tải | Tầng 1 — ban công / hành lang | Relay #11 | — |
| 15 | Orange Pi Zero W | Hub | Tầng trệt | WiFi LAN | — |

---

*Tài liệu này được tạo tự động từ ARCHITECTURE.md và design.md*  
*Cập nhật lần cuối: 2026-04-27*
