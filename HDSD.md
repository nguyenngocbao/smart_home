# HƯỚNG DẪN SỬ DỤNG — NHÀ THÀNH THỊ ECO-SMART OASIS

**Dành cho:** Chủ nhà / Người vận hành hệ thống  
**Hệ thống gồm 4 module:** Tưới cây · Rèm cửa · Đèn chiếu sáng · Cửa sổ trời

---

## MODULE 1 — HỆ THỐNG TƯỚI BAN CÔNG TỰ ĐỘNG

### Hệ thống này làm gì?

Tự động đo độ ẩm đất tại ban công sân thượng và tưới cây khi cần, không cần can thiệp thủ công hàng ngày.

### Hoạt động tự động

Hệ thống tự chạy theo **2 chế độ song song**:

**Chế độ 1 — Theo cảm biến (ưu tiên hơn):**

| Tình huống | Hệ thống làm gì |
|-----------|-----------------|
| Độ ẩm đất < 30% và trời không mưa | Tự động **bật bơm** |
| Độ ẩm đất > 70% | Tự động **tắt bơm** |
| Phát hiện mưa (dù độ ẩm bao nhiêu) | Tự động **tắt bơm ngay** |

**Chế độ 2 — Theo lịch cố định:**

| Thời gian | Hành động | Điều kiện |
|-----------|-----------|-----------|
| 06:00 sáng | Bật bơm | Chỉ khi trời không mưa |
| 06:30 sáng | Tắt bơm | Luôn luôn |
| 17:00 chiều | Bật bơm | Chỉ khi trời không mưa |
| 17:30 chiều | Tắt bơm | Luôn luôn |

> **Lưu ý:** Nếu cảm biến mưa phát hiện mưa vào đúng giờ tưới, hệ thống sẽ **bỏ qua lịch** và không bật bơm để tránh lãng phí.

### Điều khiển thủ công qua Dashboard

Khi muốn can thiệp thủ công (ví dụ: tưới thêm ngoài lịch, hoặc dừng bơm sớm):

1. Mở trình duyệt, truy cập `http://<ip-hub>:5000`
2. Vào mục **"Điều khiển"** → **"Máy bơm tưới cây"**
3. Nhấn **"BẬT BƠM"** hoặc **"TẮT BƠM"**

> Sau khi nhấn, chờ 2–3 giây để Dashboard cập nhật trạng thái mới.

### Theo dõi trạng thái

Tại trang **Tổng quan** của Dashboard:
- **Độ ẩm đất:** hiển thị % theo thời gian thực
- **Trạng thái bơm:** Đang chạy / Đã tắt
- **Cảm biến mưa:** Có mưa / Trời khô

### Lỗi thường gặp

| Hiện tượng | Nguyên nhân có thể | Cách xử lý |
|-----------|-------------------|-----------|
| Bơm không tắt dù đất đã ướt | Cảm biến bị bụi/rêu bám | Lau sạch đầu cảm biến, cắm lại |
| Bơm không bật theo lịch | Hub mất kết nối MQTT | Kiểm tra `/api/health`, restart hub |
| Dashboard hiện "Mất kết nối" | ESP32 mất WiFi | Kiểm tra nguồn ESP32, router WiFi |

---

## MODULE 2 — RÈM CỬA PHÒNG NGỦ THÔNG MINH

### Hệ thống này làm gì?

Tự động đóng/mở rèm cửa phòng ngủ dựa vào độ sáng bên ngoài. Cho phép chỉnh vị trí rèm từ xa qua Dashboard.

### Hoạt động tự động

Cảm biến ánh sáng (LDR) đo độ sáng liên tục và ra lệnh cho servo kéo rèm:

| Độ sáng | Hành động | Mục đích |
|---------|-----------|---------|
| > 80% (rất chói) | **Đóng rèm hoàn toàn** (0°) | Chắn nắng, tránh chói |
| < 20% (rất tối) | **Mở rèm hoàn toàn** (90°) | Lấy sáng tự nhiên |
| 20–80% (vừa phải) | **Giữ nguyên** vị trí hiện tại | Không can thiệp |

### Điều khiển thủ công qua Dashboard

Khi muốn chỉnh rèm theo ý muốn, bỏ qua cảm biến:

1. Vào **"Điều khiển"** → **"Rèm cửa phòng ngủ"**
2. Kéo **thanh trượt** từ 0% đến 100%
   - `0%` = Rèm đóng hoàn toàn
   - `50%` = Rèm mở một nửa
   - `100%` = Rèm mở hoàn toàn
3. Nhấn **"Áp dụng"** để xác nhận

Hoặc dùng nút nhanh: **"Đóng hoàn toàn"** / **"Mở hoàn toàn"**

> **Lưu ý quan trọng:** Sau khi chỉnh thủ công, nếu độ sáng thay đổi vượt ngưỡng (> 80% hoặc < 20%), hệ thống **sẽ tự ghi đè** vị trí rèm theo cảm biến. Đây là hành vi bình thường.

### Theo dõi trạng thái

Tại trang **Tổng quan**:
- **Độ sáng:** % theo thời gian thực
- **Vị trí rèm:** % (0% = đóng, 100% = mở)

### Lỗi thường gặp

| Hiện tượng | Nguyên nhân có thể | Cách xử lý |
|-----------|-------------------|-----------|
| Rèm không phản hồi lệnh | Servo mất nguồn hoặc kẹt cơ học | Kiểm tra nguồn ESP32, kiểm tra cơ cấu kéo |
| Vị trí rèm sai so với thực tế | Servo bị lệch góc 0° ban đầu | Cần hiệu chỉnh góc servo trong `config.h` |
| Dashboard hiện % không khớp | Delay 5–10 giây do chu kỳ publish | Bình thường, chờ thêm |

---

## MODULE 3 — ĐÈN CHIẾU SÁNG TỪ XA

### Hệ thống này làm gì?

Quản lý 2 vùng đèn (Zone) trong phòng ngủ. Tự động bật/tắt theo lịch và cho phép điều khiển từ xa.

### Hoạt động tự động theo lịch

| Thời gian | Ngày | Hành động |
|-----------|------|-----------|
| **17:30** | Thứ 7, Chủ Nhật | Bật đèn Zone 1 + Zone 2 |
| **18:00** | Thứ 2 → Thứ 6 | Bật đèn Zone 1 + Zone 2 |
| **06:00** | Hàng ngày | Tắt đèn Zone 1 + Zone 2 |

> Cuối tuần bật sớm hơn 30 phút vì thường có người ở nhà từ chiều.

### Điều khiển thủ công qua Dashboard

Bật/tắt từng Zone độc lập bất cứ lúc nào:

1. Vào **"Điều khiển"** → **"Đèn chiếu sáng"**
2. Chọn **Zone 1** (phòng ngủ chính) hoặc **Zone 2** (ban công / hành lang)
3. Nhấn **"BẬT"** hoặc **"TẮT"**

> Điều khiển thủ công **không ảnh hưởng** đến lịch tự động. Nếu bạn tắt đèn thủ công lúc 20:00, đến 06:00 hôm sau hệ thống vẫn gửi lệnh tắt (dù đèn đã tắt rồi — không gây hại).

### Theo dõi trạng thái

Tại trang **Tổng quan**:
- **Zone 1:** BẬT (●) / TẮT (○)
- **Zone 2:** BẬT (●) / TẮT (○)

### ⚠️ Lưu ý an toàn điện

Các relay trong module này nối trực tiếp vào **dây pha 220V**. Tuyệt đối không tự ý mở hộp điện relay khi đang có nguồn. Mọi sửa chữa phần điện 220V phải do người có chuyên môn thực hiện.

### Lỗi thường gặp

| Hiện tượng | Nguyên nhân có thể | Cách xử lý |
|-----------|-------------------|-----------|
| Đèn không bật theo lịch | Hub không kết nối được MQTT | Kiểm tra `/api/health` |
| Nhấn BẬT nhưng đèn không sáng | Relay hỏng hoặc bóng đèn cháy | Kiểm tra relay, thay bóng |
| Đèn 2 vùng bật cùng lúc không mong muốn | Đang theo lịch bình thường | Kiểm tra lại giờ thiết bị |

---

## MODULE 4 — CỬA SỔ TRỜI CHỐNG NÓNG & MƯA

### Hệ thống này làm gì?

Tự động mở cửa sổ trời khi nhiệt độ trong nhà quá cao để thoát nhiệt, và đóng ngay lập tức khi phát hiện mưa để bảo vệ nội thất.

### Hoạt động tự động

| Tình huống | Hành động | Ghi chú |
|-----------|-----------|---------|
| Nhiệt độ > 35°C **và** không mưa | **Mở cửa** (90°) | Thoát nhiệt tự nhiên |
| Nhiệt độ < 30°C | **Đóng cửa** (0°) | Đủ mát, không cần thông gió |
| Phát hiện mưa | **Đóng cửa ngay** (0°) | **Ưu tiên cao nhất — bất kể nhiệt độ** |
| 30°C ≤ Nhiệt độ ≤ 35°C, không mưa | Giữ nguyên | Vùng trung gian |

> **Ưu tiên an toàn:** Dù nhiệt độ có cao đến đâu, chỉ cần cảm biến phát hiện một giọt mưa, cửa sẽ **đóng ngay lập tức** trong vòng vài giây.

> **Cross-module:** Khi cảm biến mưa Module 4 phát hiện mưa, hệ thống **đồng thời** tắt luôn máy bơm tưới cây (Module 1) — vì trời đã mưa thì không cần tưới thêm.

### Điều khiển thủ công qua Dashboard

Khi cần can thiệp thủ công (ví dụ: mở cửa cho thoáng dù nhiệt độ chưa đến ngưỡng):

1. Vào **"Điều khiển"** → **"Cửa sổ trời"**
2. Nhấn **"MỞ CỬA"** hoặc **"ĐÓNG CỬA"**

> **Cảnh báo:** Nếu đang có mưa mà bạn nhấn "MỞ CỬA" thủ công, cảm biến sẽ phát hiện mưa và ra lệnh đóng cửa trở lại trong vòng 5–10 giây. Hệ thống luôn ưu tiên an toàn.

### Theo dõi trạng thái

Tại trang **Tổng quan**:
- **Nhiệt độ:** °C theo thời gian thực
- **Cảm biến mưa:** Có mưa / Trời khô
- **Cửa sổ trời:** MỞ (▲) / ĐÓNG (▼)

### Lỗi thường gặp

| Hiện tượng | Nguyên nhân có thể | Cách xử lý |
|-----------|-------------------|-----------|
| Cửa không mở dù trời nóng | Cảm biến mưa bị nhiễu (ẩm bề mặt) | Lau khô cảm biến mưa |
| Cửa mở/đóng liên tục | Nhiệt độ dao động quanh ngưỡng 35°C | Bình thường trong 1–2 phút |
| Servo không hoạt động | Mất nguồn hoặc servo quá tải | Kiểm tra nguồn 5V ESP32 |

---

## HƯỚNG DẪN CHUNG

### Khởi động hệ thống

```
1. Bật nguồn Orange Pi Zero W (Hub)       → đợi ~30 giây
2. Bật nguồn ESP32 #1 (phòng ngủ)         → LED xanh nhấp nháy = đang kết nối
3. Bật nguồn ESP32 #2 (sân thượng)        → LED xanh nhấp nháy = đang kết nối
4. Mở trình duyệt: http://<ip-hub>:5000   → Dashboard xuất hiện
5. Kiểm tra badge kết nối ở góc trên phải → 🟢 Online = hoạt động bình thường
```

### Kiểm tra sức khoẻ hệ thống

Truy cập `http://<ip-hub>:5000/api/health` để xem:
```json
{
  "status": "ok",
  "mqtt_connected": true,
  "state_store_ok": true
}
```

Nếu `status` là `"degraded"` → kiểm tra MQTT broker và kết nối mạng.

### Khi dữ liệu cảm biến không cập nhật (badge vàng ⚠️)

1. Kiểm tra đèn LED trên ESP32 — nếu tắt hẳn: mất nguồn
2. Kiểm tra router WiFi — ESP32 có trong danh sách kết nối không
3. Thử khởi động lại ESP32 (rút cắm nguồn 5 giây rồi cắm lại)
4. Nếu vẫn lỗi: kiểm tra Mosquitto broker trên Hub có đang chạy không

### Thay đổi ngưỡng tự động

Để chỉnh ngưỡng cảm biến (ví dụ: muốn bơm khi đất < 40% thay vì < 30%):

- **Thay đổi nhanh:** Sửa file `03-BACKEND/smart-home-hub/MY_RULES.py`, restart Hub — **không cần reflash firmware**
- **Thay đổi sâu (ngưỡng fallback firmware):** Sửa `config.h` trong thư mục `esp1/` hoặc `esp2/`, reflash ESP32

### Lịch sử và giám sát từ xa (Cloud)

Nếu đã bật Cloud Sync (`CLOUD_ENABLED=true` trong `.env`):
- Toàn bộ dữ liệu sensor được đẩy lên cloud broker mỗi **10 giây**
- Có thể điều khiển thiết bị từ xa qua Internet (không cần cùng mạng WiFi)
- Topic điều khiển từ xa: `cloud/{hub_id}/cmd/{location}/{actuator}`

---

*Tài liệu phản ánh code thực tế tại: firmware esp1/ · esp2/ · backend smart-home-hub/*  
*Cập nhật: 28/04/2026*
