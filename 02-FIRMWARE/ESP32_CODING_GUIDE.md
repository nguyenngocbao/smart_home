# Hướng dẫn lập trình ESP32 — Smart Home IoT
**Nhóm:** Trần Kim Phương · Lê Đức Ngọc | **GVHD:** TS. Nguyễn Huỳnh Duy Khang  
**Tool:** Arduino IDE 2.x | **Board:** ESP32 Dev Module

---

## 1. Phân chia 2 chip theo tầng

```
Nhà phố 3 tầng
│
├── Tầng 1 — Phòng ngủ
│   └── ESP32 #1  [esp32-bedroom]
│       ├── Module 2: Rèm cửa thông minh
│       │   ├── Sensor : LDR (GPIO 34) — đo độ chói
│       │   └── Actuator: Servo (GPIO 13) — kéo rèm 0–100%
│       └── Module 3: Đèn chiếu sáng từ xa
│           └── Actuator: Relay x2 (GPIO 26, 27) — đèn zone 1 & 2
│
└── Sân Thượng — Ngoài trời
    └── ESP32 #2  [esp32-rooftop]
        ├── Module 1: Tưới ban công tự động
        │   ├── Sensor : Soil moisture (GPIO 34) — độ ẩm đất
        │   └── Actuator: Relay (GPIO 26) — bơm nước
        └── Module 4: Cửa sổ trời chống nóng & mưa
            ├── Sensor : DHT22 (GPIO 4) — nhiệt độ
            │            Rain sensor (GPIO 35) — phát hiện mưa
            └── Actuator: Servo (GPIO 13) — mở/đóng cửa sổ trời
```

---

## 2. Danh sách linh kiện

### ESP32 #1 — Phòng ngủ (esp32-bedroom)

| Linh kiện | Model | Vai trò | GPIO |
|-----------|-------|---------|------|
| Vi điều khiển | ESP32 Dev Module | — | — |
| Cảm biến ánh sáng | LDR + R10kΩ (voltage divider) | Phát hiện độ chói | 34 (ADC) |
| Động cơ servo | SG90 hoặc MG996R | Kéo rèm cửa | 13 |
| Relay module | 1 hoặc 2 kênh, 5V | Điều khiển đèn | 26, 27 |
| Nguồn | Adapter 5V–2A | Cấp nguồn ESP32 + relay | — |

### ESP32 #2 — Sân thượng (esp32-rooftop)

| Linh kiện | Model | Vai trò | GPIO |
|-----------|-------|---------|------|
| Vi điều khiển | ESP32 Dev Module | — | — |
| Cảm biến độ ẩm đất | Capacitive soil moisture v1.2 | Phát hiện đất khô | 34 (ADC) |
| Cảm biến nhiệt độ | DHT22 + R4.7kΩ pull-up | Nhiệt độ không khí | 4 |
| Cảm biến mưa | Rain sensor module | Phát hiện mưa | 35 (ADC) |
| Relay module | 1 kênh, 5V | Bật/tắt bơm nước | 26 |
| Động cơ servo | MG995 (khoẻ hơn) | Mở/đóng cửa sổ trời | 13 |
| Nguồn | Adapter 5V–2A | Cấp nguồn | — |

> **Lưu ý GPIO ADC:** GPIO 34, 35, 36, 39 là ADC1 — an toàn khi WiFi hoạt động.  
> Tránh dùng GPIO 2, 12, 15 làm output trong khi flash.

---

## 3. MQTT Topics

### Quy tắc chung
```
Sensor publish : smarthome/{location_id}/sensors/{sensor_type}
Command        : smarthome/cmd/{location_id}/{actuator}
Status chip    : smarthome/status/{device_id}
Heartbeat chip : smarthome/heartbeat/{device_id}
```

### ESP32 #1 — esp32-bedroom

```
# Publish (ESP32 → Hub)
smarthome/bedroom/sensors/light          "45"          (%, 0=tối, 100=sáng)
smarthome/bedroom/sensors/curtain        "70"          (%, độ mở rèm hiện tại)
smarthome/status/esp32-bedroom           {"status":"online","version":"1.0.0"}
smarthome/heartbeat/esp32-bedroom        {"uptime":3600,"heap":80000,"rssi":-65}

# Subscribe (Hub → ESP32)
smarthome/cmd/bedroom/curtain            {"position": 70}   (0=đóng, 100=mở hoàn toàn)
smarthome/cmd/bedroom/light-1            {"state": true}
smarthome/cmd/bedroom/light-2            {"state": true}
```

### ESP32 #2 — esp32-rooftop

```
# Publish (ESP32 → Hub)
smarthome/rooftop/sensors/soil_moisture  "25"          (%)
smarthome/rooftop/sensors/temperature    "32.5"        (°C)
smarthome/rooftop/sensors/rain           "1"           (0=không mưa, 1=mưa)
smarthome/rooftop/sensors/skylight       "open"        ("open"/"closed")
smarthome/status/esp32-rooftop           {"status":"online","version":"1.0.0"}
smarthome/heartbeat/esp32-rooftop        {"uptime":...,"heap":...,"rssi":...}

# Subscribe (Hub → ESP32)
smarthome/cmd/rooftop/pump               {"state": true}
smarthome/cmd/rooftop/skylight           {"state": true}   (true=mở, false=đóng)
```

---

## 4. Logic tự động tại chip (không cần Hub)

### esp32-bedroom
```
Mỗi 5 giây đọc LDR:
  LDR < 20%  →  Servo → đóng rèm (position = 0)
  LDR > 80%  →  Servo → mở rèm  (position = 100)

Nhận lệnh MQTT curtain.position = 50  →  Servo → mở 50%
Nhận lệnh MQTT light-1.state = true   →  Relay ON
```

### esp32-rooftop
```
Mỗi 5 giây đọc sensors:
  Soil < 30%                →  Relay pump ON
  Soil > 70%                →  Relay pump OFF
  Rain = 1                  →  Relay pump OFF (ưu tiên)
  Rain = 1                  →  Servo skylight → đóng (khẩn)
  Rain = 0 AND Temp > 35°C  →  Servo skylight → mở
  Rain = 0 AND Temp < 30°C  →  Servo skylight → đóng
```

---

## 5. Cài đặt Arduino IDE

### Bước 1 — Thêm ESP32 board

1. Mở Arduino IDE 2.x
2. **File → Preferences** (Mac: Cmd+,)
3. Trong ô **"Additional boards manager URLs"** dán vào:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. **Tools → Board → Boards Manager**
5. Tìm **esp32** → chọn **"esp32 by Espressif Systems"** → **Install**
6. Đợi tải xong (~100MB)

### Bước 2 — Cài Libraries (Tools → Library Manager)

Tìm và cài đặt **từng thư viện** dưới đây:

| Thư viện | Author | Dùng cho |
|---------|--------|---------|
| `PubSubClient` | Nick O'Leary | MQTT client |
| `DHT sensor library` | Adafruit | Đọc DHT22 |
| `Adafruit Unified Sensor` | Adafruit | Dependency của DHT |
| `ArduinoJson` | Benoit Blanchon | Parse JSON lệnh MQTT |
| `ESP32Servo` | Kevin Harrington | Điều khiển servo |

### Bước 3 — Chọn board trước khi upload

1. **Tools → Board → esp32 → ESP32 Dev Module**
2. **Tools → Port** → chọn port USB của ESP32
   - Mac: thường là `/dev/cu.usbserial-XXXXX`
   - Nếu không thấy port: cài driver CP2102 hoặc CH340

### Bước 4 — Mở sketch đúng cách

Arduino IDE yêu cầu: **tên folder = tên file .ino**

```
esp32_bedroom/
    esp32_bedroom.ino   ← mở file này
    config.h
    sensors.h / sensors.cpp
    actuators.h / actuators.cpp
    mqtt_handler.h / mqtt_handler.cpp
```

Mở bằng: **File → Open** → chọn file `esp32_bedroom.ino`

---

## 6. Sửa config.h trước khi nạp

Mở `config.h`, sửa **3 dòng** sau:

```cpp
#define WIFI_SSID     "Tên_WiFi_nhà_bạn"
#define WIFI_PASSWORD "Mật_khẩu_WiFi"
#define MQTT_BROKER   "192.168.x.x"   // IP máy chạy backend
```

**Lấy IP máy Mac:**
```bash
ipconfig getifaddr en0
```

---

## 7. Upload firmware

1. Cắm ESP32 vào máy qua USB
2. Chọn đúng board và port (Bước 3)
3. Nhấn nút **Upload** (→) hoặc **Ctrl+U**
4. Nếu lỗi "Failed to connect": giữ nút **BOOT** trên ESP32 trong khi upload
5. Upload xong → mở **Serial Monitor** (Tools → Serial Monitor, 115200 baud)
6. Thấy log `[WiFi] OK — IP: 192.168.x.x` là thành công

---

## 8. Test không cần phần cứng

Chạy mock script để giả lập dữ liệu:

```bash
# Terminal 1 — Chạy Mosquitto broker
mosquitto

# Terminal 2 — Chạy Backend
cd 03-BACKEND/smart-home-hub
python main.py

# Terminal 3 — Giả lập 2 ESP32
python 07-TESTING/mock_esp32.py

# Terminal 4 — Xem lệnh từ Hub gửi về ESP32
mosquitto_sub -t "smarthome/cmd/#" -v
```

**Test thủ công bằng curl:**
```bash
# Bật đèn phòng ngủ
curl -X POST http://localhost:5000/api/control/bedroom/light-1 \
  -H "Content-Type: application/json" -d '{"state": true}'

# Mở rèm 70%
curl -X POST http://localhost:5000/api/control/bedroom/curtain \
  -H "Content-Type: application/json" -d '{"state": true, "position": 70}'

# Bật bơm tưới
curl -X POST http://localhost:5000/api/control/rooftop/pump \
  -H "Content-Type: application/json" -d '{"state": true}'

# Xem toàn bộ state
curl http://localhost:5000/api/state | python3 -m json.tool
```

---

## 9. Sơ đồ nối dây nhanh

### LDR (voltage divider)
```
3.3V ──── R10kΩ ──── GPIO34 ──── LDR ──── GND
                          │
                       đọc ADC
```

### Relay Module (active LOW)
```
ESP32 GPIO26 ──── IN  (relay module)
ESP32 GND    ──── GND (relay module)
5V           ──── VCC (relay module)
[Tải]        ──── COM + NO
```

### Servo Motor
```
ESP32 GPIO13 ──── Signal (dây vàng/cam)
5V           ──── VCC    (dây đỏ)      ← dùng nguồn ngoài nếu servo lớn
GND          ──── GND    (dây nâu/đen)
```

### DHT22
```
3.3V ──── Pin 1 (VCC)
GPIO4 ─── Pin 2 (Data) ──── R4.7kΩ ──── 3.3V
GND  ──── Pin 4 (GND)
```

### Soil Moisture (Capacitive)
```
3.3V  ──── VCC
GND   ──── GND
GPIO34 ─── AOUT
```

---

## 10. Troubleshooting thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|---------|
| Không thấy Port USB | Chưa cài driver | Cài CP2102 driver từ Silicon Labs |
| `Failed to connect` | Chưa vào boot mode | Giữ nút BOOT khi bấm Upload |
| DHT22 trả về `nan` | Pull-up resistor sai | Kiểm tra R4.7kΩ giữa Data và 3.3V |
| MQTT không kết nối được | Sai IP broker | Chạy `ipconfig getifaddr en0` lấy IP mới |
| Servo rung lắc | Nguồn không đủ | Dùng nguồn 5V ngoài cho servo, không qua ESP32 |
| ADC đọc sai | Dùng GPIO ADC2 khi WiFi bật | Chỉ dùng GPIO 32–39 (ADC1) |
| Relay không nhả | Active LOW bị nhầm | Kiểm tra: OFF = `digitalWrite(pin, HIGH)` |
