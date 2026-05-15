# Sơ đồ nối dây vật lý — Eco-Smart Oasis

> Nguồn điện: Adapter 5V–3A (hình chữ nhật) dùng cho cả 2 tầng.  
> ⚠️ Relay điều khiển đèn/bơm 220V — cẩn thận phần điện xoay chiều!

---

## TẦNG 1 — ESP32 #1 (Phòng Ngủ)

### Thiết bị: LDR · Servo SG90 · Relay đèn · DHT22

```
                    ┌─────────────────────┐
                    │   NGUỒN 5V – 3A     │
                    │  ┌───┐   ┌───┐      │
                    │  │5V+│   │GND│      │
                    └──┤   ├───┤   ├──────┘
                       │   │   │   │
          ┌────────────┘   │   │   └────────────────────────────────┐
          │ 5V             │   │ GND                                │
          │                │   │                                    │
          │    ┌───────────┘   └─────────────┐                     │
          │    │                             │                     │
          ▼    ▼                             ▼                     │
   ┌──────────────────────────────────────────────┐               │
   │              ESP32 DevKit v1                 │               │
   │                                              │               │
   │  VIN ◄── 5V (từ nguồn)          3V3 ──────► │──► 3.3V Rail  │
   │  GND ◄── GND (từ nguồn)         GND ──────► │──► GND Rail   │
   │                                              │               │
   │  GPIO34 ────────────────────────────────────►│ LDR           │
   │  GPIO13 ────────────────────────────────────►│ Servo SG90    │
   │  GPIO26 ────────────────────────────────────►│ Relay đèn     │
   │  GPIO4  ────────────────────────────────────►│ DHT22         │
   │  GPIO2  ────────────────────────────────────►│ LED on-board  │
   └──────────────────────────────────────────────┘               │
                                                                   │
          ┌────────────────────────────────────────────────────────┘
          │ GND chung
          ▼
     ═══ GND Rail ═══════════════════════════════════════════════


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 2: LDR (Cảm biến ánh sáng)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   3.3V Rail ──────┬──── R 10kΩ ────── GPIO34 (ESP32)
                   │
                  LDR
                   │
   GND Rail  ──────┘

   [Dây nâu/đen LDR vào GND, dây còn lại vào 1 đầu R10kΩ,
    đầu kia R10kΩ vào GPIO34 và 3.3V]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 2: SERVO SG90 (Rèm cửa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Servo SG90
   ┌────────────┐
   │ ĐỎ   (VCC)│──────────── 5V Rail (từ nguồn, KHÔNG lấy từ ESP32)
   │ NÂU  (GND)│──────────── GND Rail
   │ CAM  (SIG)│──────────── GPIO13 (ESP32)
   └────────────┘

   ⚠️  Lấy 5V TRỰC TIẾP từ nguồn, không qua pin 5V ESP32
       (ESP32 chỉ cho ra ~500mA, Servo cần nhiều hơn)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 3: RELAY ĐÈN TẦNG 1 (Active LOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Module Relay 1 kênh
   ┌──────────────────┐
   │ VCC              │──── 5V Rail
   │ GND              │──── GND Rail
   │ IN               │──── GPIO26 (ESP32)
   │                  │
   │ COM ─────────────┼──── Dây PHA từ nguồn 220V
   │ NO  ─────────────┼──── Dây PHA đến đèn
   │ NC  (không dùng) │
   └──────────────────┘
           │
       Dây TRUNG TÍNH (N) nối thẳng từ nguồn vào đèn (không qua relay)

   ⚠️  PHẦN 220V: cẩn thận điện giật!
       COM → dây pha vào | NO → dây pha ra đèn | N → nối thẳng vào đèn


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SENSOR: DHT22 (Nhiệt độ phòng ngủ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   DHT22 (nhìn mặt trước có lỗ thoáng khí)
   ┌────┬────┬────┬────┐
   │Pin1│Pin2│Pin3│Pin4│
   │VCC │DATA│ NC │GND │
   └────┴────┴────┴────┘
     │    │         │
     │    │    R 4.7kΩ
     │    ├────┤       ├──── 3.3V Rail   ← pull-up bắt buộc!
     │    │
     │   GPIO4 (ESP32)
     │
   3.3V Rail                GND Rail ◄── Pin4 GND

   ⚠️  Nếu không có R4.7kΩ: đọc sai / lỗi NaN liên tục
```

---

## SÂN THƯỢNG — ESP32 #2 (Rooftop)

### Thiết bị: Soil Moisture · Relay bơm · Relay đèn · Rain Sensor · Servo MG995

```
                    ┌─────────────────────┐
                    │   NGUỒN 5V – 3A     │
                    │  ┌───┐   ┌───┐      │
                    │  │5V+│   │GND│      │
                    └──┤   ├───┤   ├──────┘
                       │   │   │   │
          ┌────────────┘   │   │   └────────────────────────────────┐
          │ 5V             │   │ GND                                │
          │                │   │                                    │
          │    ┌───────────┘   └─────────────┐                     │
          │    │                             │                     │
          ▼    ▼                             ▼                     │
   ┌──────────────────────────────────────────────┐               │
   │              ESP32 DevKit v1                 │               │
   │                                              │               │
   │  VIN ◄── 5V (từ nguồn)          3V3 ──────► │──► 3.3V Rail  │
   │  GND ◄── GND (từ nguồn)         GND ──────► │──► GND Rail   │
   │                                              │               │
   │  GPIO34 ────────────────────────────────────►│ Soil Moisture │
   │  GPIO26 ────────────────────────────────────►│ Relay bơm     │
   │  GPIO27 ────────────────────────────────────►│ Relay đèn     │
   │  GPIO35 ────────────────────────────────────►│ Rain Sensor   │
   │  GPIO13 ────────────────────────────────────►│ Servo MG995   │
   │  GPIO2  ────────────────────────────────────►│ LED on-board  │
   └──────────────────────────────────────────────┘               │
                                                                   │
          ┌────────────────────────────────────────────────────────┘
          │ GND chung
          ▼
     ═══ GND Rail ═══════════════════════════════════════════════


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 1: SOIL MOISTURE SENSOR (Độ ẩm đất)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Soil Moisture Capacitive v1.2
   ┌────────────┐
   │ VCC        │──────────── 3.3V Rail
   │ GND        │──────────── GND Rail
   │ AOUT       │──────────── GPIO34 (ESP32)
   └────────────┘

   💡 Dùng 3.3V (không dùng 5V) để ADC đọc chính xác hơn


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 1: RELAY BƠM NƯỚC (Active LOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Module Relay 1 kênh
   ┌──────────────────┐
   │ VCC              │──── 5V Rail
   │ GND              │──── GND Rail
   │ IN               │──── GPIO26 (ESP32)
   │                  │
   │ COM ─────────────┼──── Cực (+) nguồn DC bơm
   │ NO  ─────────────┼──── Cực (+) vào máy bơm
   │ NC  (không dùng) │
   └──────────────────┘
           │
       Cực (–) nguồn DC nối thẳng vào cực (–) bơm (không qua relay)

   💡 Bơm DC 5V/12V: đấu COM-NO vào mạch DC
      Nếu dùng bơm AC 220V: giống sơ đồ relay đèn bên dưới


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 3: RELAY ĐÈN SÂN THƯỢNG (Active LOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Module Relay 1 kênh
   ┌──────────────────┐
   │ VCC              │──── 5V Rail
   │ GND              │──── GND Rail
   │ IN               │──── GPIO27 (ESP32)
   │                  │
   │ COM ─────────────┼──── Dây PHA từ nguồn 220V
   │ NO  ─────────────┼──── Dây PHA đến đèn
   │ NC  (không dùng) │
   └──────────────────┘
           │
       Dây TRUNG TÍNH (N) nối thẳng từ nguồn vào đèn

   ⚠️  PHẦN 220V: cẩn thận điện giật!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 4: RAIN SENSOR (Cảm biến mưa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Rain Sensor Module (gồm 2 phần: board điện tử + tấm cảm biến)
   ┌────────────┐
   │ VCC        │──────────── 3.3V Rail
   │ GND        │──────────── GND Rail
   │ AO         │──────────── GPIO35 (ESP32)   ← analog output
   │ DO         │   (không dùng — chỉ dùng AO)
   └────────────┘

   💡 Đặt tấm cảm biến ở nơi thoáng, board điện tử trong hộp chống nước


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODULE 4: SERVO MG995 (Cửa sổ trời)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Servo MG995
   ┌────────────┐
   │ ĐỎ   (VCC)│──────────── 5V Rail (TRỰC TIẾP từ nguồn)
   │ NÂU  (GND)│──────────── GND Rail
   │ CAM  (SIG)│──────────── GPIO13 (ESP32)
   └────────────┘

   ⚠️  MG995 ăn dòng rất lớn (1–2A khi tải).
       BẮT BUỘC lấy 5V thẳng từ nguồn.
       KHÔNG nối qua pin 5V/VIN của ESP32 — sẽ reset ESP32!
```

---

## Sơ đồ tổng thể — Kết nối GND chung

```
Nguyên tắc quan trọng nhất: TẤT CẢ GND phải chung 1 điểm!

   NGUỒN 5V
   ┌────────┐
   │  5V (+)├──────┬─────────── VIN (ESP32)
   │        │      ├─────────── VCC Relay bơm
   │        │      ├─────────── VCC Relay đèn
   │        │      └─────────── VCC Servo (dây đỏ)
   │        │
   │  GND (-)├──────┬─────────── GND (ESP32) ──► 3.3V Rail bên trong
   │        │      ├─────────── GND Relay bơm
   │        │      ├─────────── GND Relay đèn
   │        │      ├─────────── GND Servo (dây nâu)
   │        │      ├─────────── GND Soil Sensor
   │        │      ├─────────── GND Rain Sensor
   │        │      ├─────────── GND DHT22 (Pin 4)
   │        │      └─────────── GND LDR (qua mạch chia áp)
   └────────┘
   
   3.3V Rail (lấy từ chân 3V3 của ESP32):
   ├── VCC Soil Moisture Sensor
   ├── VCC Rain Sensor
   ├── VCC DHT22 (Pin 1)
   ├── Một đầu R10kΩ (LDR voltage divider)
   └── Pull-up R4.7kΩ cho DHT22
```

---

## Bảng tóm tắt nhanh — Tra cứu khi nối dây

### ESP32 #1 — Tầng 1

| Thiết bị | Dây VCC | Dây GND | Dây Signal → GPIO |
|----------|---------|---------|-------------------|
| LDR | 3.3V (qua R10kΩ) | GND | GPIO34 |
| Servo SG90 | 5V nguồn | GND | GPIO13 |
| Relay đèn | 5V nguồn | GND | GPIO26 |
| DHT22 | 3.3V | GND | GPIO4 + R4.7kΩ pull-up lên 3.3V |

### ESP32 #2 — Sân Thượng

| Thiết bị | Dây VCC | Dây GND | Dây Signal → GPIO |
|----------|---------|---------|-------------------|
| Soil Moisture | 3.3V | GND | GPIO34 (AOUT) |
| Relay bơm | 5V nguồn | GND | GPIO26 |
| Relay đèn | 5V nguồn | GND | GPIO27 |
| Rain Sensor | 3.3V | GND | GPIO35 (AO) |
| Servo MG995 | 5V nguồn | GND | GPIO13 |

---

## Lưu ý khi lắp ráp

```
✅ NÊN làm:
   • Dùng breadboard hoặc domino nối để tạo thanh 5V Rail và GND Rail chung
   • Đo nguồn bằng đồng hồ trước khi nối ESP32
   • Nối GND trước, VCC sau
   • Kiểm tra cực relay bằng Serial Monitor trước khi đấu 220V

❌ KHÔNG làm:
   • Lấy 5V từ chân 5V/VIN ESP32 để cấp cho Servo MG995 (quá dòng)
   • Bỏ điện trở pull-up 4.7kΩ của DHT22 (đọc lỗi NaN)
   • Nối Soil Sensor vào 5V (ADC đọc sẽ bị lệch do reference 3.3V)
   • Để chân GPIO35 và GPIO34 không có gì nối (ESP32 đọc nhiễu)
   • Chạm vào phần COM/NO/NC của relay khi đang có điện 220V
```
