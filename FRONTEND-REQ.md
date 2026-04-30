# FRONTEND REQUIREMENTS — Smart Home Dashboard
## Nhà Thành Thị Eco-Smart Oasis

> **Mục đích file này:** Prompt-ready spec để gen code HTML/CSS/JS cho Web Dashboard điều khiển hệ thống Smart Home IoT.  
> **Stack Backend:** Python 3.11 / Flask 3.0, REST API tại `http://<host>:5000`  
> **Polling:** Dashboard gọi `GET /api/state` mỗi **2 giây** để cập nhật dữ liệu (không dùng WebSocket).

---

## 1. YÊU CẦU TỔNG QUAN

Tạo một **Single-page Dashboard** (1 file HTML duy nhất, inline CSS + JS) để:

1. **Giám sát real-time** toàn bộ cảm biến và trạng thái thiết bị trong nhà.
2. **Điều khiển thủ công** các thiết bị (đèn, rèm, bơm, cửa trời) qua nút bấm.
3. **Hiển thị cảnh báo** khi dữ liệu cảm biến quá cũ (thiết bị offline).

### Yêu cầu kỹ thuật bắt buộc

- **1 file HTML duy nhất** — không tách file CSS/JS riêng.
- **Vanilla JS** — không dùng React, Vue, hay bất kỳ framework nào.
- **Chart.js** (CDN) — dùng cho đồ thị nếu cần.
- **Responsive** — hiển thị tốt trên màn hình 1080p và tablet (768px+).
- **Polling interval:** `setInterval(fetchState, 2000)` — gọi mỗi 2 giây.
- **Không dùng localStorage** — mọi state lưu trong JS variable.

---

## 2. THIẾT KẾ GIAO DIỆN

### 2.1 Layout tổng thể

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Logo + Tên nhà + Trạng thái kết nối + Giờ     │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  SIDEBAR     │   MAIN CONTENT                          │
│  (200px)     │                                          │
│              │   [Section đang active]                 │
│  - Overview  │                                          │
│  - Điều khiển│                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
│  FOOTER: "Cập nhật lần cuối: HH:MM:SS" + polling dot  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Màu sắc & Typography

| Element | Giá trị |
|---------|---------|
| Background trang | `#0f172a` (dark navy) |
| Card background | `#1e293b` |
| Card border | `#334155` |
| Accent chính | `#38bdf8` (sky blue) |
| Text chính | `#f1f5f9` |
| Text phụ | `#94a3b8` |
| Màu BẬT (ON) | `#22c55e` (green) |
| Màu TẮT (OFF) | `#ef4444` (red) |
| Màu OFFLINE | `#f59e0b` (amber) |
| Font | `'Inter', system-ui, sans-serif` (Google Fonts CDN) |

### 2.3 Trạng thái kết nối (Header badge)

- 🟢 **Online** — polling thành công trong 5 giây gần nhất.
- 🔴 **Offline** — polling thất bại liên tiếp 3 lần.
- 🟡 **Reconnecting...** — đang thử lại.

---

## 3. SECTION 1 — TỔNG QUAN (Overview)

### 3.1 Thẻ trạng thái ESP32 (Device Status Cards)

Hiển thị **2 card** — một cho mỗi ESP32:

```
┌───────────────────────────────┐
│  ⚙️  ESP32 — Sân Thượng       │
│  esp32-rooftop                │
│                               │
│  🟢 Online                    │
│  Uptime: 2h 34m               │
│  WiFi: -68 dBm                │
│  Heap: 142 KB                 │
└───────────────────────────────┘
```

**Dữ liệu lấy từ:** `GET /api/state` → field `heartbeat` (xem mục 5).  
**Logic offline:** Nếu timestamp heartbeat > 60 giây so với giờ hiện tại → badge đỏ "Offline".

---

### 3.2 Sensor Cards — Sân Thượng (ESP32 #2)

Hiển thị **4 card cảm biến** xếp dạng grid 2×2:

#### Card: Nhiệt độ & Độ ẩm không khí
```
┌─────────────────────────────┐
│  🌡️  Nhiệt độ               │
│                             │
│       37.5 °C               │  ← số lớn, nổi bật
│                             │
│  💧 Độ ẩm: 72%              │
│  Cập nhật: 00:03 trước      │
└─────────────────────────────┘
```
**Cảnh báo:** Nền đỏ nhạt nếu nhiệt độ > 35°C.

#### Card: Phát hiện mưa
```
┌─────────────────────────────┐
│  🌧️  Cảm biến mưa           │
│                             │
│       ĐANG MƯA              │  ← text lớn, nền xanh dương
│   (hoặc "Trời khô")         │
│                             │
│  Cập nhật: 00:01 trước      │
└─────────────────────────────┘
```

#### Card: Độ ẩm đất
```
┌─────────────────────────────┐
│  🌱  Độ ẩm đất              │
│                             │
│  [████████░░]  82%          │  ← progress bar
│                             │
│  Bơm: ● Đang chạy           │
│  Cập nhật: 00:05 trước      │
└─────────────────────────────┘
```
**Màu progress bar:** Xanh lá nếu ≥ 40%, vàng nếu 20–40%, đỏ nếu < 20%.

#### Card: Trạng thái cửa trời
```
┌─────────────────────────────┐
│  🔲  Cửa sổ trời            │
│                             │
│       ▲ MỞ                  │  ← icon mở/đóng
│   (hoặc "▼ ĐÓNG")           │
│                             │
│  Cập nhật: 00:02 trước      │
└─────────────────────────────┘
```

---

### 3.3 Sensor Cards — Tầng 1 (ESP32 #1)

Hiển thị **2 card cảm biến** xếp ngang:

#### Card: Ánh sáng phòng ngủ
```
┌─────────────────────────────┐
│  ☀️  Ánh sáng               │
│                             │
│  [███████████░]  90%        │  ← progress bar
│                             │
│  Rèm: vị trí 30%            │
│  Cập nhật: 00:04 trước      │
└─────────────────────────────┘
```
**Màu progress bar:** Xanh nếu < 60%, vàng nếu 60–80%, đỏ nếu > 80% (quá chói).

#### Card: Đèn chiếu sáng
```
┌─────────────────────────────┐
│  💡  Đèn phòng ngủ          │
│                             │
│  Zone 1: ● BẬT              │
│  Zone 2: ○ TẮT              │
│                             │
│  Cập nhật: 00:01 trước      │
└─────────────────────────────┘
```

---

## 4. SECTION 2 — ĐIỀU KHIỂN THIẾT BỊ (Control Panel)

Hiển thị **4 panel điều khiển**, mỗi panel tương ứng 1 module.

### 4.1 Panel: Máy bơm tưới cây (Module 1)

```
┌──────────────────────────────────────────────────┐
│  💧  Máy bơm tưới cây                            │
│  Vị trí: Sân thượng | ESP32 #2                   │
│                                                  │
│  Trạng thái hiện tại:  ● Đang chạy               │
│  Độ ẩm đất hiện tại:   24%  (Cần tưới)           │
│                                                  │
│  [    BẬT BƠM    ]   [    TẮT BƠM    ]          │
│  (nút xanh lá)        (nút xám)                  │
│                                                  │
│  ⚠️  Auto: Hub tự điều khiển dựa vào sensor      │
└──────────────────────────────────────────────────┘
```

**Button BẬT:** `POST /api/control/rooftop/pump` body `{"state": true}`  
**Button TẮT:** `POST /api/control/rooftop/pump` body `{"state": false}`  
**Disable button** tương ứng với trạng thái hiện tại (đang BẬT → disable nút BẬT).

---

### 4.2 Panel: Rèm cửa (Module 2)

```
┌──────────────────────────────────────────────────┐
│  🪟  Rèm cửa phòng ngủ                           │
│  Vị trí: Tầng 1 | ESP32 #1                       │
│                                                  │
│  Vị trí hiện tại: ████░░░░░░  40%               │
│                                                  │
│  Chỉnh vị trí:                                  │
│  [0%]  [━━━━●━━━━━━━━━]  [100%]                 │
│         Slider 0–100                             │
│                                                  │
│  [  Áp dụng  ]   [Đóng hoàn toàn] [Mở hoàn toàn]│
└──────────────────────────────────────────────────┘
```

**Slider:** `<input type="range" min="0" max="100">`  
**Button Áp dụng:** `POST /api/control/bedroom/curtain` body `{"position": <slider_value>}`  
**Button Đóng:** gửi `{"position": 0}`  
**Button Mở:** gửi `{"position": 100}`  

---

### 4.3 Panel: Đèn chiếu sáng (Module 3)

```
┌──────────────────────────────────────────────────┐
│  💡  Đèn chiếu sáng                              │
│  Vị trí: Tầng 1 | ESP32 #1                       │
│                                                  │
│  Zone 1 — Phòng ngủ chính                        │
│  Trạng thái: ● BẬT                               │
│  [    BẬT    ]   [    TẮT    ]                  │
│                                                  │
│  ─────────────────────────────────────           │
│                                                  │
│  Zone 2 — Ban công / Hành lang                   │
│  Trạng thái: ○ TẮT                               │
│  [    BẬT    ]   [    TẮT    ]                  │
│                                                  │
│  ⏰ Tự động: BẬT lúc 18:00 / TẮT lúc 06:00      │
└──────────────────────────────────────────────────┘
```

**Zone 1 BẬT:** `POST /api/control/bedroom/light1` body `{"state": true}`  
**Zone 1 TẮT:** `POST /api/control/bedroom/light1` body `{"state": false}`  
**Zone 2:** tương tự với endpoint `light2`.

---

### 4.4 Panel: Cửa sổ trời (Module 4)

```
┌──────────────────────────────────────────────────┐
│  🔲  Cửa sổ trời                                 │
│  Vị trí: Sân thượng | ESP32 #2                   │
│                                                  │
│  Trạng thái: ▲ ĐANG MỞ                           │
│  Nhiệt độ: 37.5°C  |  Mưa: Không                │
│                                                  │
│  [    MỞ CỬA    ]   [    ĐÓNG CỬA    ]          │
│                                                  │
│  ⚠️  Cảnh báo: Cửa sẽ tự đóng nếu phát hiện mưa │
└──────────────────────────────────────────────────┘
```

**Mở:** `POST /api/control/rooftop/skylight` body `{"state": true}`  
**Đóng:** `POST /api/control/rooftop/skylight` body `{"state": false}`

---

## 5. API REFERENCE (Backend đã có sẵn)

### 5.1 GET `/api/state` — Lấy toàn bộ trạng thái

**Response format:**
```json
{
  "locations": {
    "bedroom": {
      "sensors": {
        "light":        { "value": 90,   "unit": "%",  "timestamp": "2026-04-27T10:30:00" },
        "curtain":      { "value": 40,   "unit": "%",  "timestamp": "2026-04-27T10:30:00" },
        "light1_state": { "value": 1,    "unit": "",   "timestamp": "2026-04-27T10:30:00" },
        "light2_state": { "value": 0,    "unit": "",   "timestamp": "2026-04-27T10:30:00" }
      },
      "actuators": {
        "curtain": { "state": true,  "value": "40", "timestamp": "...", "updated_by": "api" },
        "light1":  { "state": true,  "value": "on", "timestamp": "...", "updated_by": "rule" },
        "light2":  { "state": false, "value": "off","timestamp": "...", "updated_by": "rule" }
      }
    },
    "rooftop": {
      "sensors": {
        "temperature":  { "value": 37.5, "unit": "°C", "timestamp": "2026-04-27T10:30:00" },
        "rain":         { "value": 0,    "unit": "",   "timestamp": "2026-04-27T10:30:00" },
        "soil_moisture":{ "value": 24,   "unit": "%",  "timestamp": "2026-04-27T10:30:00" },
        "pump_state":   { "value": 1,    "unit": "",   "timestamp": "2026-04-27T10:30:00" },
        "skylight":     { "value": "open","unit": "",  "timestamp": "2026-04-27T10:30:00" }
      },
      "actuators": {
        "pump":     { "state": true,  "value": "on",     "timestamp": "...", "updated_by": "rule" },
        "skylight": { "state": true,  "value": "open",   "timestamp": "...", "updated_by": "firmware" }
      }
    }
  },
  "heartbeat": {
    "esp32-bedroom": { "uptime": 9240, "heap": 145320, "rssi": -68, "timestamp": "2026-04-27T10:30:00" },
    "esp32-rooftop": { "uptime": 8760, "heap": 138900, "rssi": -72, "timestamp": "2026-04-27T10:30:00" }
  },
  "timestamp": "2026-04-27T10:30:05"
}
```

---

### 5.2 POST `/api/control/{location}/{actuator}` — Gửi lệnh điều khiển

| Location | Actuator | Payload |
|----------|----------|---------|
| `bedroom` | `light1` | `{"state": true/false}` |
| `bedroom` | `light2` | `{"state": true/false}` |
| `bedroom` | `curtain` | `{"position": 0–100}` |
| `rooftop` | `pump` | `{"state": true/false}` |
| `rooftop` | `skylight` | `{"state": true/false}` |

**Response thành công:**
```json
{ "ok": true, "location_id": "bedroom", "actuator": "light1", "state": true }
```

**Response lỗi:**
```json
{ "error": "MQTT not connected" }   // HTTP 503
```

---

## 6. LOGIC QUAN TRỌNG CHO FE

### 6.1 Tính "thời gian cập nhật"
```javascript
function timeAgo(isoTimestamp) {
  const diff = Math.floor((Date.now() - new Date(isoTimestamp)) / 1000);
  if (diff < 60)  return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff/60)}m trước`;
  return `${Math.floor(diff/3600)}h trước`;
}
```

### 6.2 Phát hiện thiết bị stale (dữ liệu cũ)
```javascript
function isStale(isoTimestamp, thresholdSeconds = 60) {
  return (Date.now() - new Date(isoTimestamp)) / 1000 > thresholdSeconds;
}
// Nếu stale → hiển thị badge vàng "⚠️ Mất kết nối" trên card
```

### 6.3 Vô hiệu hóa nút sau khi gửi lệnh
```javascript
// Sau khi user nhấn nút → disable nút trong 3 giây để tránh spam
button.disabled = true;
setTimeout(() => { button.disabled = false; }, 3000);
```

### 6.4 Hiển thị thông báo kết quả
```javascript
// Sau mỗi lệnh điều khiển, hiển thị toast notification 2 giây:
// ✅ "Đã bật đèn Zone 1"
// ❌ "Lỗi: Không kết nối được MQTT"
```

### 6.5 Polling với error handling
```javascript
let failCount = 0;
async function fetchState() {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    failCount = 0;
    updateUI(data);
  } catch (e) {
    failCount++;
    if (failCount >= 3) setConnectionStatus('offline');
  }
}
setInterval(fetchState, 2000);
fetchState(); // gọi ngay lần đầu
```

---

## 7. CẤU TRÚC HTML GỢI Ý

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Smart Home Dashboard</title>
  <!-- Google Fonts: Inter -->
  <!-- Chart.js CDN (nếu cần chart) -->
  <style> /* toàn bộ CSS inline */ </style>
</head>
<body>
  <header>   <!-- logo, tên nhà, badge kết nối, đồng hồ --> </header>
  <div class="layout">
    <nav class="sidebar">  <!-- menu: Overview | Điều khiển --> </nav>
    <main>
      <section id="overview">   <!-- sensor cards --> </section>
      <section id="control" class="hidden"> <!-- control panels --> </section>
    </main>
  </div>
  <footer>  <!-- "Cập nhật: HH:MM:SS" + polling indicator --> </footer>
  <div id="toast"></div>  <!-- notification toast -->
  <script> /* toàn bộ JS inline */ </script>
</body>
</html>
```

---

## 8. PROMPT MẪU ĐỂ GEN CODE

Dán prompt sau vào Claude/ChatGPT:

```
Tạo một file HTML duy nhất (inline CSS + vanilla JS, không framework) cho Smart Home Dashboard dựa trên spec sau:

[DÁN TOÀN BỘ NỘI DUNG FILE NÀY VÀO ĐÂY]

Yêu cầu bổ sung:
- Dark theme theo màu sắc đã định nghĩa
- Responsive 768px+
- Polling GET /api/state mỗi 2 giây
- Toast notification sau mỗi lệnh điều khiển
- Hiển thị ⚠️ badge nếu sensor không cập nhật quá 60 giây
- Code rõ ràng, có comment tiếng Việt
```

---

*File này được tạo từ ARCHITECTURE.md và TONG-HOP-DU-AN.md*  
*Cập nhật: 27/04/2026*
