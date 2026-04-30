# 02-FIRMWARE — ESP32 Firmware

**Nhóm:** Lê Đức Ngọc · Trần Kim Phương | **GVHD:** TS. Nguyễn Huỳnh Duy Khang  
**Trạng thái:** ✅ HOÀN THÀNH | **Tool:** Arduino IDE 2.x | **Board:** ESP32 Dev Module  
**Firmware version:** 1.0.0

---

## Sơ đồ cắm dây — ESP32 #1 (Phòng Ngủ)

```
                              ESP32 DevKit v1
                         ┌─────────────────────┐
                 3.3V ───┤ 3V3             GND  ├─── GND
                         ┤ EN              GPIO23├
                         ┤ GPIO36(VP)      GPIO22├
                         ┤ GPIO39(VN)      GPIO1 ├
  LDR──R10kΩ──[GPIO34]──┤ GPIO34(ADC1)    GPIO3 ├
                         ┤ GPIO35          GPIO21├
                         ┤ GPIO32          GPIO19├
                         ┤ GPIO33          GPIO18├
                         ┤ GPIO25          GPIO5 ├
  Relay đèn 1 ──[GPIO26]┤ GPIO26          GPIO17├
  Relay đèn 2 ──[GPIO27]┤ GPIO27          GPIO16├
                         ┤ GPIO14          GPIO4 ├
                         ┤ GPIO12          GPIO0 ├
                   GND ──┤ GND             GPIO2 ├── LED on-board
  Servo SG90 ───[GPIO13]┤ GPIO13          GPIO15├
                         ┤ 5V              GPIO8 ├
                         └─────────────────────────┘
```

### Chi tiết từng linh kiện — ESP32 #1

```
┌─────────────────────────────────────────────────────────────┐
│  LDR (cảm biến ánh sáng — Module 2)                        │
│                                                             │
│  3.3V ──┬── R10kΩ ──── GPIO34                              │
│         └── LDR ────── GND                                 │
│                                                             │
│  * ADC đọc điểm giữa R10kΩ và LDR                         │
│  * Trời sáng → ADC thấp  |  Trời tối → ADC cao            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Servo SG90 / MG996R (rèm cửa — Module 2)                  │
│                                                             │
│  GPIO13 ──── Signal  (dây CAM / VÀNG)                      │
│  5V ──────── VCC     (dây ĐỎ)   ← dùng nguồn ngoài        │
│  GND ─────── GND     (dây NÂU / ĐEN)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Relay đèn Zone 1 — active LOW (Module 3)                   │
│                                                             │
│  GPIO26 ──── IN                                             │
│  GND ──────── GND                                           │
│  5V ───────── VCC                                           │
│  Tải điện:   COM ──── dây pha vào                          │
│              NO ───── dây pha ra đèn                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Relay đèn Zone 2 — active LOW (Module 3)                   │
│                                                             │
│  GPIO27 ──── IN       (giống hệt Zone 1, chỉ đổi GPIO)     │
│  GND ──────── GND                                           │
│  5V ───────── VCC                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Sơ đồ cắm dây — ESP32 #2 (Sân Thượng)

```
                              ESP32 DevKit v1
                         ┌─────────────────────┐
                 3.3V ───┤ 3V3             GND  ├─── GND
                         ┤ EN              GPIO23├
                         ┤ GPIO36(VP)      GPIO22├
                         ┤ GPIO39(VN)      GPIO1 ├
  SoilSensor ──[GPIO34]──┤ GPIO34(ADC1)    GPIO3 ├
  Rain AO ───[GPIO35] ───┤ GPIO35(ADC1)    GPIO21├
                         ┤ GPIO32          GPIO19├
                         ┤ GPIO33          GPIO18├
                         ┤ GPIO25          GPIO5 ├
  Relay bơm ──[GPIO26] ──┤ GPIO26          GPIO17├
                         ┤ GPIO27          GPIO16├
                         ┤ GPIO14          GPIO4 ├── DHT22 Data + R4.7kΩ → 3.3V
                         ┤ GPIO12          GPIO0 ├
                   GND ──┤ GND             GPIO2 ├── LED on-board
  Servo MG995 ──[GPIO13]┤ GPIO13          GPIO15├
                         ┤ 5V              GPIO8 ├
                         └─────────────────────────┘
```

### Chi tiết từng linh kiện — ESP32 #2

```
┌─────────────────────────────────────────────────────────────┐
│  Soil Moisture Capacitive v1.2 (Module 1)                   │
│                                                             │
│  3.3V ──── VCC                                              │
│  GND ───── GND                                              │
│  GPIO34 ── AOUT                                             │
│                                                             │
│  * ADC cao (~4095) → đất khô  |  ADC thấp → đất ướt       │
│  * Cần hiệu chỉnh SOIL_DRY_ADC / SOIL_WET_ADC thực tế     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Relay bơm nước — active LOW (Module 1)                     │
│                                                             │
│  GPIO26 ──── IN                                             │
│  GND ──────── GND                                           │
│  5V ───────── VCC                                           │
│  Bơm:        COM ──── nguồn + bơm                          │
│              NO ───── cực còn lại của bơm                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DHT22 (nhiệt độ — Module 4)                                │
│                                                             │
│  3.3V ──── Pin 1 (VCC)                                      │
│  GPIO4 ─── Pin 2 (Data) ──┬── R4.7kΩ ── 3.3V  ← pull-up  │
│            Pin 3 (NC)     │                                 │
│  GND ───── Pin 4 (GND)    └── (điểm đọc)                   │
│                                                             │
│  ⚠️  Bắt buộc có điện trở pull-up 4.7kΩ                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Rain Sensor (cảm biến mưa — Module 4)                      │
│                                                             │
│  3.3V ──── VCC                                              │
│  GND ───── GND                                              │
│  GPIO35 ── AO  (Analog Output)                              │
│                                                             │
│  * ADC < 180 → đang mưa  |  ADC > 180 → khô               │
│  * Chỉnh ngưỡng RAIN_THRESHOLD trong config.h              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Servo MG995 (cửa sổ trời — Module 4)                       │
│                                                             │
│  GPIO13 ──── Signal  (dây CAM / VÀNG)                      │
│  5V ──────── VCC     (dây ĐỎ)   ← BẮT BUỘC nguồn ngoài   │
│  GND ─────── GND     (dây NÂU / ĐEN)                       │
│                                                             │
│  ⚠️  MG995 kéo dòng lớn, KHÔNG dùng 5V từ ESP32           │
└─────────────────────────────────────────────────────────────┘
```

---

---

## Tổng quan

2 chip ESP32 xử lý toàn bộ cảm biến và actuator trong nhà:

```
[ESP32 #1 — esp32-bedroom]          [ESP32 #2 — esp32-rooftop]
  Module 2: Rèm cửa thông minh        Module 1: Tưới ban công tự động
  Module 3: Đèn chiếu sáng từ xa      Module 4: Cửa sổ trời chống nóng & mưa
         │                                      │
         └──────────── MQTT local :1883 ────────┘
                              │
                    [Orange Pi Zero W — Hub]
```

Cả 2 chip đều có:
- **Tự động kết nối lại** WiFi và MQTT khi mất kết nối
- **Heartbeat** mỗi 30 giây (uptime, heap, RSSI)
- **Status publish** khi boot (`online`) và khi mất nguồn (LWT `offline`)
- **Đọc sensor mỗi 5 giây**, publish MQTT mỗi 10 giây

---

## Cấu trúc file

```
02-FIRMWARE/
├── esp1/                       ESP32 #1 — Phòng ngủ (bedroom)
│   ├── esp1.ino                Setup + Loop chính
│   ├── config.h                WiFi, MQTT broker, GPIO pins, ngưỡng tự động
│   ├── wifi_mqtt.h/.cpp        WiFi connect, MQTT client, heartbeat, route lệnh
│   ├── module2_rem.h/.cpp      Module 2: LDR đọc ánh sáng + Servo kéo rèm
│   └── module3_den.h/.cpp      Module 3: 2 Relay điều khiển đèn
│
├── esp2/                       ESP32 #2 — Sân thượng (rooftop)
│   ├── esp2.ino                Setup + Loop chính
│   ├── config.h                WiFi, MQTT broker, GPIO pins, ngưỡng tự động
│   ├── wifi_mqtt.h/.cpp        WiFi connect, MQTT client, heartbeat, route lệnh
│   ├── module1_tuoi.h/.cpp     Module 1: Soil moisture + Relay bơm nước
│   └── module4_cua_troi.h/.cpp Module 4: DHT22 + Rain sensor + Servo cửa trời
│
├── ESP32_CODING_GUIDE.md       Quy ước code C++ cho dự án
└── README.md                   File này
```

---

## ESP32 #1 — Phòng ngủ (`esp1/`)

### Module 2 — Rèm cửa thông minh

| Linh kiện | GPIO | Ghi chú |
|-----------|------|---------|
| LDR + R10kΩ | 34 (ADC1) | Voltage divider, ADC1 an toàn khi WiFi bật |
| Servo SG90/MG996R | 13 | 0° = đóng rèm, 90° = mở rèm |

**Sơ đồ nối dây:**
```
LDR:  3.3V ── R10kΩ ── GPIO34 ── LDR ── GND
Servo: GPIO13 → Signal | 5V → VCC (nguồn ngoài) | GND → GND
```

**Logic tự động** (đọc mỗi 5 giây):
```
LDR > 80%  →  Servo 0°   (đóng rèm — quá chói)
LDR < 20%  →  Servo 90°  (mở rèm  — quá tối)
20–80%     →  Giữ nguyên
```

**MQTT:**
```
PUBLISH:  smarthome/bedroom/sensors/light    → "75"   (% ánh sáng)
          smarthome/bedroom/sensors/curtain  → "0"    (% vị trí rèm)
SUBSCRIBE: smarthome/cmd/bedroom/curtain    ← {"position": 70}
```

---

### Module 3 — Đèn chiếu sáng từ xa

| Linh kiện | GPIO | Ghi chú |
|-----------|------|---------|
| Relay đèn zone 1 | 26 | Active LOW (ON = LOW) |
| Relay đèn zone 2 | 27 | Active LOW (ON = LOW) |

**Sơ đồ nối dây (cả 2 relay):**
```
GPIO26/27 → IN | GND → GND | 5V → VCC | Tải điện → COM + NO
```

**Logic:** Hub tự động gửi lệnh bật lúc 18:00, tắt lúc 06:00 qua MQTT. Điều khiển thủ công bất cứ lúc nào qua Dashboard.

**MQTT:**
```
PUBLISH:   smarthome/bedroom/sensors/light1_state → "1"/"0"
           smarthome/bedroom/sensors/light2_state → "1"/"0"
SUBSCRIBE: smarthome/cmd/bedroom/light1 ← {"state": true}
           smarthome/cmd/bedroom/light2 ← {"state": true}
```

---

### Tổng GPIO — ESP32 #1

| GPIO | Vai trò |
|------|---------|
| 34 ADC | LDR — đo độ sáng ánh sáng (Module 2) |
| 13 | Servo SG90/MG996R — kéo rèm (Module 2) |
| 26 | Relay đèn zone 1, active LOW (Module 3) |
| 27 | Relay đèn zone 2, active LOW (Module 3) |
| 2 | LED on-board — trạng thái WiFi/MQTT |

**Libraries cần cài (Tools → Library Manager):**
- `PubSubClient` by Nick O'Leary
- `ArduinoJson` by Benoit Blanchon
- `ESP32Servo` by Kevin Harrington

---

## ESP32 #2 — Sân thượng (`esp2/`)

### Module 1 — Tưới ban công tự động

| Linh kiện | GPIO | Ghi chú |
|-----------|------|---------|
| Soil Moisture Capacitive v1.2 | 34 (ADC1) | ADC cao = khô, ADC thấp = ướt |
| Relay bơm nước | 26 | Active LOW |

**Sơ đồ nối dây:**
```
Soil: 3.3V → VCC | GND → GND | GPIO34 → AOUT
Relay bơm: GPIO26 → IN | GND → GND | 5V → VCC | Bơm → COM + NO
```

**Logic tự động** (đọc mỗi 5 giây):
```
Đang mưa (Rain=1)   →  Tắt bơm NGAY (ưu tiên tuyệt đối)
Đất < 30%           →  Bật bơm
Đất > 70%           →  Tắt bơm
30–70%              →  Giữ nguyên
```

**Calibration cần đo thực tế:**
- `SOIL_DRY_ADC = 4095` — đất khô hoàn toàn (trong không khí)
- `SOIL_WET_ADC = 800` — đất ướt hoàn toàn (cần đo lại khi nhúng nước)

**MQTT:**
```
PUBLISH:   smarthome/rooftop/sensors/soil_moisture → "25"  (%)
           smarthome/rooftop/sensors/pump_state    → "1"/"0"
SUBSCRIBE: smarthome/cmd/rooftop/pump ← {"state": true}
```

---

### Module 4 — Cửa sổ trời chống nóng & mưa

| Linh kiện | GPIO | Ghi chú |
|-----------|------|---------|
| DHT22 + R4.7kΩ pull-up | 4 | Pull-up giữa Data và 3.3V |
| Rain sensor module | 35 (ADC1) | ADC < 180 → mưa |
| Servo MG995 | 13 | Nguồn ngoài 5V bắt buộc |

**Sơ đồ nối dây:**
```
DHT22:  3.3V → Pin1 VCC | GPIO4 → Pin2 Data + R4.7kΩ → 3.3V | GND → Pin4
Rain:   3.3V → VCC | GND → GND | GPIO35 → AO
Servo:  GPIO13 → Signal | 5V ngoài → VCC | GND → GND
```

**Logic tự động** (đọc mỗi 5 giây):
```
Ưu tiên 1 — Mưa:     Rain > ngưỡng → Đóng cửa trời NGAY + Tắt bơm
Ưu tiên 2 — Nhiệt độ: Temp > 35°C & không mưa → Mở cửa trời
                       Temp < 30°C              → Đóng cửa trời
                       30–35°C                  → Giữ nguyên
```

**MQTT:**
```
PUBLISH:   smarthome/rooftop/sensors/temperature → "32.5"  (°C)
           smarthome/rooftop/sensors/rain        → "1"/"0"
           smarthome/rooftop/sensors/skylight    → "open"/"closed"
SUBSCRIBE: smarthome/cmd/rooftop/skylight ← {"state": true}
```

---

### Tổng GPIO — ESP32 #2

| GPIO | Vai trò |
|------|---------|
| 34 ADC | Soil moisture — đo độ ẩm đất (Module 1) |
| 26 | Relay bơm tưới nước, active LOW (Module 1) |
| 4 | DHT22 — nhiệt độ + độ ẩm không khí (Module 4) |
| 35 ADC | Rain sensor — phát hiện mưa (Module 4) |
| 13 | Servo MG995 — cửa sổ trời (Module 4) |
| 2 | LED on-board — trạng thái WiFi/MQTT |

**Libraries cần cài (Tools → Library Manager):**
- `PubSubClient` by Nick O'Leary
- `DHT sensor library` by Adafruit
- `Adafruit Unified Sensor` by Adafruit (dependency của DHT)
- `ArduinoJson` by Benoit Blanchon
- `ESP32Servo` by Kevin Harrington

---

## Hướng dẫn nạp firmware

### Bước 1 — Cài Arduino IDE 2.x

1. Tải tại [arduino.cc/en/software](https://www.arduino.cc/en/software)
2. **File → Preferences** → thêm vào *Additional boards manager URLs*:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. **Tools → Board → Boards Manager** → tìm `esp32` → cài **esp32 by Espressif Systems**

### Bước 2 — Sửa `config.h` trước khi nạp

Mở `config.h` của từng chip, sửa **3 dòng**:

```cpp
#define WIFI_SSID     "Tên_WiFi"
#define WIFI_PASSWORD "Mật_khẩu"
#define MQTT_BROKER   "192.168.x.x"   // IP máy Hub: ipconfig getifaddr en0
```

### Bước 3 — Nạp lên ESP32

1. **Tools → Board → esp32 → ESP32 Dev Module**
2. **Tools → Port** → chọn port USB (Mac: `/dev/cu.usbserial-XXXXX`)
3. Upload (`Ctrl+U`) — nếu lỗi *"Failed to connect"*: giữ nút **BOOT** khi bấm Upload
4. Mở **Serial Monitor** (115200 baud) → thấy `[WiFi] OK — IP: ...` là thành công

---

## Bảng tổng hợp MQTT Topics

| Chiều | Topic | Payload | Module |
|-------|-------|---------|--------|
| ESP1 → Hub | `smarthome/bedroom/sensors/light` | `"85"` (%) | M2 |
| ESP1 → Hub | `smarthome/bedroom/sensors/curtain` | `"50"` (%) | M2 |
| ESP1 → Hub | `smarthome/bedroom/sensors/light1_state` | `"1"`/`"0"` | M3 |
| ESP1 → Hub | `smarthome/bedroom/sensors/light2_state` | `"1"`/`"0"` | M3 |
| Hub → ESP1 | `smarthome/cmd/bedroom/curtain` | `{"position":70}` | M2 |
| Hub → ESP1 | `smarthome/cmd/bedroom/light1` | `{"state":true}` | M3 |
| Hub → ESP1 | `smarthome/cmd/bedroom/light2` | `{"state":true}` | M3 |
| ESP2 → Hub | `smarthome/rooftop/sensors/soil_moisture` | `"25"` (%) | M1 |
| ESP2 → Hub | `smarthome/rooftop/sensors/pump_state` | `"1"`/`"0"` | M1 |
| ESP2 → Hub | `smarthome/rooftop/sensors/temperature` | `"32.5"` (°C) | M4 |
| ESP2 → Hub | `smarthome/rooftop/sensors/rain` | `"1"`/`"0"` | M4 |
| ESP2 → Hub | `smarthome/rooftop/sensors/skylight` | `"open"`/`"closed"` | M4 |
| Hub → ESP2 | `smarthome/cmd/rooftop/pump` | `{"state":true}` | M1 |
| Hub → ESP2 | `smarthome/cmd/rooftop/skylight` | `{"state":true}` | M4 |
| ESP1/2 → Hub | `smarthome/status/{device_id}` | `{"status":"online","version":"1.0.0"}` | — |
| ESP1/2 → Hub | `smarthome/heartbeat/{device_id}` | `{"uptime":N,"heap":N,"rssi":N}` | — |

---

## Test không cần phần cứng

```bash
# Terminal 1: Chạy MQTT broker
mosquitto

# Terminal 2: Giả lập ESP32 gửi sensor data
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/soil_moisture" -m "20"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/temperature"   -m "36.5"
mosquitto_pub -h localhost -t "smarthome/rooftop/sensors/rain"          -m "0"
mosquitto_pub -h localhost -t "smarthome/bedroom/sensors/light"         -m "85"

# Terminal 3: Theo dõi lệnh Hub gửi về ESP32
mosquitto_sub -h localhost -t "smarthome/cmd/#" -v

# Gửi lệnh thủ công
mosquitto_pub -h localhost -t "smarthome/cmd/bedroom/curtain"  -m '{"position":50}'
mosquitto_pub -h localhost -t "smarthome/cmd/bedroom/light1"   -m '{"state":true}'
mosquitto_pub -h localhost -t "smarthome/cmd/rooftop/pump"     -m '{"state":true}'
mosquitto_pub -h localhost -t "smarthome/cmd/rooftop/skylight" -m '{"state":true}'
```
