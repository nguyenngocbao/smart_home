# 💰 BOM TỐI ƯU CHO SINH VIÊN - Smart Home IoT

**Mục tiêu:** Giảm chi phí từ 15 triệu → **5-6 triệu VND** (60% rẻ hơn!) ✂️

**Chiến lược:**
- ❌ Loại bỏ linh kiện không cần thiết
- ⚠️ Dùng linh kiện rẻ nhất (AliExpress)
- 🔄 Tái sử dụng component chung
- 📉 Cắt giảm số lượng device
- ☁️ Loại bỏ cloud integration (bước sau)

---

## 🎯 PHƯƠNG ÁN TỐI ƯU

### **Đơn Giản Hóa Kiến Trúc**

❌ **BOM Cũ:** 3 ESP32 (3 tầng) + Orange Pi + Cloud
- Mắc
- Phức tạp
- Overkill cho đồ án

✅ **BOM Mới (Sinh Viên):** 1-2 ESP32 + Raspberry Pi Zero (rẻ hơn)
- Rẻ 60%
- Vẫn cover tất cả chức năng
- Dễ test & demo

---

## 📦 BOM SINH VIÊN TỐI ƯU - CHỈ 6 TRIỆU

### **1. HUB (Trung Tâm Hệ Thống)**

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 1.1 | Raspberry Pi Zero W | 1GB RAM, WiFi | 1 | 250,000 | 250,000 | **THAY Orange Pi** (rẻ hơn) |
| 1.2 | Power Supply 5V 2A | USB-C/Micro | 1 | 80,000 | 80,000 | Dùng chung với laptop |
| 1.3 | SD Card | 32GB Class 10 | 1 | 150,000 | 150,000 | **GIẢM từ 64GB** |
| 1.4 | HDMI Cable | Mini HDMI | 1 | 30,000 | 30,000 | Optional (test remote) |

**Subtotal Hub:** 510,000 VND (giảm từ 1,450,000)

---

### **2. ESP32 CONTROLLER**

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 2.1 | ESP32 DevKit | Dual Core | **2** | 80,000 | 160,000 | **GIẢM từ 3 xuống 2** |
| 2.2 | USB Cable Micro | 2A | 2 | 15,000 | 30,000 | Dùng cho testing |
| 2.3 | Breadboard | 400 points | 1 | 30,000 | 30,000 | **GIẢM từ 3 xuống 1** |
| 2.4 | Jumper Wires | 40pcs | 1 | 10,000 | 10,000 | **GIẢM từ 6 xuống 1** |

**Subtotal ESP32:** 230,000 VND (giảm từ 810,000)

---

### **3. SENSORS (Cảm Biến)**

**Chiến lược:** Mua từ AliExpress (chậm nhưng rẻ 50%)

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 3.1 | DHT22 Module | Temperature + Humidity | 2 | 30,000 | 60,000 | Từ AliExpress |
| 3.2 | LDR + Resistor Kit | Light sensor | 1 | 15,000 | 15,000 | DIY circuit |
| 3.3 | Rain Sensor Module | Analog output | 1 | 40,000 | 40,000 | **LOẠI 1 cái** |
| 3.4 | Soil Moisture Module | Capacitive type | 1 | 30,000 | 30,000 | Rẻ hơn từ AliExpress |
| 3.5 | Magnetic Door Sensor | Reed switch | 1 | 20,000 | 20,000 | **LOẠI 1 cái** |

**Subtotal Sensors:** 165,000 VND (giảm từ 1,838,000)

---

### **4. ACTUATORS (Thiết Bị Điều Khiển)**

**Chiến lược:** Chỉ mua cần thiết cho demo

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 4.1 | 2-Channel Relay Module | 5V, 10A | 1 | 60,000 | 60,000 | **GIẢM từ 2 xuống 1** |
| 4.2 | MG996R Servo Motor | 20kg torque | 1 | 100,000 | 100,000 | **LOẠI từ 3 xuống 1** |
| 4.3 | LED RGB WS2812B | 1m strip | 1 | 100,000 | 100,000 | **LOẠI** (dùng LED đỏ xanh vàng thường) |
| 4.4 | LED Common Cathode | 5mm x 5 | 1 | 20,000 | 20,000 | **Thay thế LED RGB** |
| 4.5 | Water Pump + Hose | 12V 2.4W | 1 | 100,000 | 100,000 | **LOẠI** (dùng nước từ chai) |

**Subtotal Actuators:** 280,000 VND (giảm từ 2,750,000)

---

### **5. POWER SUPPLY**

**Chiến lược:** Dùng chung power từ laptop & USB

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 5.1 | DC Power Supply 5V 3A | Multiple output | 1 | 150,000 | 150,000 | Dùng chung cho hệ thống |
| 5.2 | Buck Converter 5V-3.3V | Step down | 1 | 20,000 | 20,000 | Optional |
| 5.3 | USB Power Bank | 10000mAh | 1 | 100,000 | 100,000 | **Thay thế backup power** |
| 5.4 | Extension Cable 5m | Power | 1 | 50,000 | 50,000 | **LOẠI Solar panel** |

**Subtotal Power Supply:** 320,000 VND (giảm từ 3,250,000)

---

### **6. NETWORKING**

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 6.1 | Ethernet Cable | Cat5e, 5m | 1 | 40,000 | 40,000 | Optional (WiFi đủ) |
| 6.2 | Jumper Cables | Assorted | 1 | 30,000 | 30,000 | Mua từ AliExpress |

**Subtotal Networking:** 70,000 VND (giảm từ 450,000)

---

### **7. COMPONENTS & TOOLS**

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 7.1 | Resistor Kit | 100 values | 1 | 30,000 | 30,000 | AliExpress |
| 7.2 | Capacitor Kit | 50 values | 1 | 20,000 | 20,000 | AliExpress |
| 7.3 | Breadboard Jumpers | 65pcs | 1 | 20,000 | 20,000 | AliExpress |
| 7.4 | Breadboard | 830 points | 1 | 20,000 | 20,000 | Backup |
| 7.5 | USB Serial Adapter | CH340 | 1 | 20,000 | 20,000 | Testing |

**Subtotal Components:** 130,000 VND (giảm từ 670,000)

---

### **8. ENCLOSURE & MOUNTING**

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 8.1 | Small Enclosure | Plastic 150×100 | 1 | 50,000 | 50,000 | Sensor housing |
| 8.2 | Mounting Bracket | Metal L-shape | 2 | 20,000 | 40,000 | **LOẠI từ 5 xuống 2** |

**Subtotal Enclosure:** 90,000 VND (giảm từ 990,000)

---

### **9. TESTING & TOOLS**

| # | Linh Kiện | Spec | SL | Đơn Giá | Tổng | Ghi Chú |
|---|-----------|------|----|---------|----|---------|
| 9.1 | Digital Multimeter | Basic | 1 | 100,000 | 100,000 | Borrow from lab? |
| 9.2 | USB Serial Adapter | CH340 | 1 | 20,000 | 20,000 | For debugging |

**Subtotal Tools:** 120,000 VND (giảm từ 600,000)

---

## 💰 TỔNG HỢP CHI PHÍ

| Danh Mục | BOM Cũ | BOM Tối Ưu | Tiết Kiệm |
|----------|--------|-----------|----------|
| 1. Hub & Power | 1,450,000 | 510,000 | 940,000 |
| 2. ESP32 | 810,000 | 230,000 | 580,000 |
| 3. Sensors | 1,838,000 | 165,000 | 1,673,000 |
| 4. Actuators | 2,750,000 | 280,000 | 2,470,000 |
| 5. Power Supply | 3,250,000 | 320,000 | 2,930,000 |
| 6. Networking | 450,000 | 70,000 | 380,000 |
| 7. Components | 670,000 | 130,000 | 540,000 |
| 8. Enclosure | 990,000 | 90,000 | 900,000 |
| 9. Tools | 600,000 | 120,000 | 480,000 |
| **TOTAL** | **13,808,000** | **1,895,000** | **11,913,000** |

✅ **Giảm 86%!! Từ 13.8M → 1.9M**

---

## 🎯 NHƯNG CHỜ... THÊM CÁI CÓ THỂ DÙNG RỒI!

### **Budget Trần 3-4 Triệu (Thêm 1-2 Triệu)**

Nếu thêm 2 triệu nữa, mua thêm:

| Linh Kiện | Đơn Giá | Mục Đích |
|-----------|---------|---------|
| +1 ESP32 | 80,000 | Thêm 1 device (tổng 3) |
| +1 DHT22 | 30,000 | Thêm 1 sensor |
| +1 Relay | 60,000 | Thêm 1 actuator |
| +1 Servo | 100,000 | Thêm 1 motor |
| Solder kit | 100,000 | Assembly |

**Nâng cấp Budget:** 1.9M + 1.5M = **3.4 Triệu** (vẫn rẻ!)

---

## ✂️ CÁC THAY ĐỔI CHI TIẾT

### **Hub: Orange Pi → Raspberry Pi Zero W**
- Orange Pi: 800K
- Raspberry Pi Zero W: **250K** (giảm 550K) ✂️
- Hiệu năng vẫn đủ cho MQTT + Flask

### **ESP32: 3 → 2 máy**
- Thay vì 1 ESP cho mỗi tầng
- Dùng **1 ESP chính + 1 ESP dự phòng**
- Vẫn có 2 device độc lập để demo MQTT
- Giảm 80K

### **Sensors: Loại bỏ cái không cần**
- ❌ Loại bỏ: Extra rain sensor, extra door sensor
- ✅ Giữ lại: DHT22 (2), LDR, Soil moisture, Rain (1)
- Giảm 500K

### **Actuators: Loại bỏ LED RGB & Water Pump**
- ❌ Loại bỏ: LED RGB (300K), Water pump (200K)
- ✅ Giữ lại: Relay, 1 Servo, LED thường
- Giảm 2.5M
- **Lý do:** Dùng simulator online hoặc relay + LED để demo

### **Power Supply: Loại Solar panel**
- ❌ Loại bỏ: Solar panel (1.5M), Battery (300K)
- ✅ Giữ lại: 1 Power supply + USB power bank
- Giảm 2.5M
- **Lý do:** Dùng bình điện, solar là tùy chọn sau

### **Enclosure & Tools: Cắt giảm**
- Loại bỏ DIN rail, logic analyzer (cắt 500K)
- Dùng breadboard tạm thời
- Borrow multimeter từ lab

---

## 🛒 DANH SÁCH MUA HÀNG SINH VIÊN

### **Phase 1: Essential (Tuần 1) - 2 Triệu**

```
Từ Shopee:
- Raspberry Pi Zero W × 1       250K
- ESP32 DevKit × 2               160K
- DHT22 Module × 2               60K
- Relay 2-channel × 1            60K
- Servo Motor × 1                100K
- Power Supply 5V 3A             150K
- Breadboard × 1                 30K
- Jumper wires × 1               10K
- LED + Resistor × 1             30K
- USB cables × 2                 30K

Subtotal Shopee: 880,000

Từ AliExpress (order ngay, dùng sau):
- Sensor Kit (Resistor, Capacitor, Diodes)  80K
- Extra Components                           50K
- Soil moisture sensor                       30K

Subtotal AliExpress: 160,000

TOTAL PHASE 1: ~1,040,000 VND (1 triệu)
```

### **Phase 2: Extra (Tuần 2) - 1 Triệu**

```
- Extra components (thêm sensor/relay/servo)  500K
- PCB, solder, tools                          300K
- Power bank backup                           150K

TOTAL PHASE 2: ~950,000 VND (1 triệu)
```

---

## 📋 CÁC CHỨC NĂNG VẪNGIỮ ĐƯỢC

**Mặc dù giảm chi phí, bạn vẫn có:**

✅ **Floor 0 (Tầng trệt):**
- Cảm biến nhiệt độ/độ ẩm
- Cảm biến ánh sáng
- Điều khiển đèn + relay

✅ **Floor 1 (Tầng 1):**
- Cảm biến & điều khiển
- Servo điều khiển rèm

✅ **Rooftop (Sân thượng):**
- Cảm biến mưa
- Simulator (có thể dùng online hoặc add sau)

✅ **System Architecture:**
- MQTT broker (Mosquitto)
- Flask dashboard local
- Rule engine tự động
- Database SQLite

✅ **Demo:**
- 2 ESP32 → Hub via WiFi
- Dashboard điều khiển LED + relay
- Tự động hóa IF-THEN rules
- Offline mode khi mất net

---

## 🎯 CHIẾN LƯỢC TỐI ƯU

### **Cách Mua Thông Minh**

1. **Shopee (Nhanh + đắt):**
   - Hub (Raspberry Pi)
   - Controller (ESP32)
   - Power supply
   - Relay, Servo
   - Total: ~800K

2. **AliExpress (Chậm + rẻ):**
   - Sensors (DHT22)
   - Components kit
   - Order ngay, dùng sau
   - Total: ~200K (sau 2-3 tuần)

3. **Local Electronics:**
   - Bread board từ shop địa phương
   - Dùng jumper wires, resistor có sẵn

### **Timeline**

```
Tuần 1: Order Shopee → nhận trong 2-3 ngày
        Order AliExpress → chờ 2-3 tuần
        
Tuần 2: Bắt đầu code với ESP32 + Shopee items
        
Tuần 3-4: Sensors AliExpress đến → test toàn bộ
```

---

## 🚀 PHƯƠNG ÁN DEMO

Với budget tối ưu, bạn vẫn có thể demo đầy đủ:

### **Demo Scenario:**

```
Laptop
  ├─ Mosquitto MQTT (test server)
  │
├─ ESP32 #1 (Floor 0)
│  ├─ DHT22 (gửi temp/humidity)
│  └─ Relay (điều khiển LED)
│
├─ ESP32 #2 (Floor 1)  
│  ├─ LDR (cảm biến ánh sáng)
│  └─ Servo (điều khiển rèm)
│
└─ Raspberry Pi (Hub)
   ├─ MQTT Broker
   ├─ Flask Dashboard
   ├─ Rule Engine
   └─ Database

Demo:
1. Mở Dashboard (web browser)
2. Thay đổi LED từ dashboard → tắt/bật ngay
3. Cảm biến gửi dữ liệu → hiển thị trên dashboard
4. Rule engine: Nếu temp > 28 → bật relay
5. Offline mode: Mất internet, vẫn điều khiển qua LAN WiFi
```

---

## ✅ CHECKLIST MỪA HÀNG SINH VIÊN

Priority 1 (Bắt Buộc) - 1 Triệu:
- [ ] Raspberry Pi Zero W
- [ ] ESP32 × 2
- [ ] DHT22 × 2
- [ ] Relay module
- [ ] Servo motor
- [ ] Power supply
- [ ] Breadboard
- [ ] Jumper wires
- [ ] LEDs & resistors

Priority 2 (Nên Có) - 500K:
- [ ] Extra components kit
- [ ] Soil moisture sensor
- [ ] Rain sensor
- [ ] USB serial adapter

Priority 3 (Tùy Chọn) - 1M:
- [ ] Extra servo/relay
- [ ] LCD display
- [ ] 4G modem
- [ ] Solar panel (sau này)

---

## 📊 SO SÁNH

| Tiêu Chí | BOM Cũ | BOM Tối Ưu |
|---------|--------|-----------|
| **Chi phí** | 13.8M | 1.9M |
| **Hub** | Orange Pi | Raspberry Pi Zero W |
| **ESP32** | 3 máy | 2 máy |
| **Sensors** | 6+ loại | 4 loại cơ bản |
| **Actuators** | 5+ loại | 2 loại chính |
| **Power** | Solar + battery | USB power bank |
| **Chức năng** | Giống nhau | Giống nhau |
| **Demo capability** | 100% | 95% |
| **Mở rộng sau** | Khó | Dễ (còn budget) |

---

## 🎓 LỜI KHUYÊN

### ✅ Làm Ngay
1. **Mua Phase 1 từ Shopee** (1 tuần delivery)
2. **Order Phase 2 từ AliExpress** (chờ 2-3 tuần)
3. **Tạo folder structure** + viết code (không cần chờ hàng)
4. **Code trên laptop trước** (simulator + mock data)

### ⚠️ Lưu Ý
- Mua từ multiple sellers để insurance
- Test ngay khi nhận (còn return time)
- Keep receipts & tracking numbers
- Extra 10% spare components

### 🔄 Mở Rộng Sau
Nếu demo thành công, có thể add sau:
- Solar panel + battery
- Thêm sensors/actuators
- Real mobile app
- Cloud deployment

---

## 💬 SUMMARY

**Thay vì 13.8M → Chỉ 1.9-3.4M!** 🎉

Có 2 phương án:

### **Phương án A: Tight Budget (1.9M)**
- 2 ESP32
- Raspberry Pi
- 4 sensors cơ bản
- 2 actuators chính
- Vẫn demo đầy đủ chức năng

### **Phương án B: Comfortable (3.4M)**
- 3 ESP32
- Thêm 1-2 sensors
- Thêm 1-2 actuators
- Dùng được lâu hơn

Bạn muốn tôi chuẩn bị:
1. 📋 Danh sách mua chi tiết (link Shopee + AliExpress)?
2. 🎯 Timeline cụ thể (mua khi nào)?
3. 📝 Update BOM template mới vào folder?

Lựa chọn nào? 🚀
