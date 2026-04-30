# 🏠 Smart Home IoT - Cấu Trúc Dự Án

**Dự án:** Nhà Thành Thị Eco-Smart Oasis  
**Người quản lý:** Trần Kim Phương, Lê Đức Ngọc  
**Giảng viên:** TS. Nguyễn Huỳnh Duy Khang  
**Ngày tạo:** 2026-04-26

---

## 📂 Cấu Trúc Folder Toàn Cảnh

```
smart-home-project/
│
├── 📋 00-PLANNING/              # Kế hoạch & Thiết kế
│   ├── 01-Hardware-Planning/
│   │   ├── BOM.xlsx             # Bill of Materials (mua gì, giá bao nhiêu)
│   │   ├── Component-List.md    # Danh sách linh kiện chi tiết
│   │   ├── Wiring-Diagram.pdf   # Sơ đồ đấu nối
│   │   └── Cost-Breakdown.xlsx  # Chi phí từng phần
│   │
│   ├── 02-Architecture/
│   │   ├── System-Architecture.pdf     # Kiến trúc tổng thể
│   │   ├── Network-Diagram.png         # Sơ đồ mạng MQTT
│   │   ├── Data-Flow.md                # Luồng dữ liệu
│   │   └── Device-Communication.md    # Giao tiếp giữa devices
│   │
│   ├── 03-Requirements/
│   │   ├── Functional-Requirements.md  # Yêu cầu chức năng
│   │   ├── Non-Functional-Req.md       # Yêu cầu phi chức năng
│   │   ├── Use-Cases.md                # Các trường hợp sử dụng
│   │   └── Acceptance-Criteria.md      # Tiêu chí chấp nhận
│   │
│   └── 04-Timeline/
│       ├── Project-Schedule.md         # Lộ trình tuần by tuần
│       ├── Milestones.xlsx             # Các mốc quan trọng
│       └── Risk-Assessment.md          # Đánh giá rủi ro
│
├── 🛠️ 01-HARDWARE/              # Xây dựng phần cứng
│   ├── 01-Components/
│   │   ├── ESP32-Setup/
│   │   │   ├── Specifications.md
│   │   │   ├── GPIO-Pinout.pdf
│   │   │   └── Power-Requirements.md
│   │   │
│   │   ├── Orange-Pi-Setup/
│   │   │   ├── OS-Installation.md
│   │   │   ├── Hardware-Specs.md
│   │   │   └── GPIO-Reference.md
│   │   │
│   │   └── Sensors-Actuators/
│   │       ├── DHT22-Temp-Humidity/
│   │       ├── Rain-Sensor/
│   │       ├── Light-Sensor-LDR/
│   │       ├── Soil-Moisture/
│   │       ├── Servo-Motor/
│   │       ├── Relay-Module/
│   │       └── Door-Sensor/
│   │
│   ├── 02-Assembly/
│   │   ├── Assembly-Guide.pdf          # Hướng dẫn lắp ráp
│   │   ├── Wiring-Photos/              # Ảnh đấu nối thực tế
│   │   ├── Testing-Checklist.md        # Kiểm tra từng phần
│   │   └── Troubleshooting.md          # Xử lý lỗi phần cứng
│   │
│   └── 03-Testing/
│       ├── Hardware-Tests.md           # Test chức năng phần cứng
│       ├── Sensor-Calibration.md       # Hiệu chuẩn cảm biến
│       └── Power-Consumption.xlsx      # Tiêu thụ điện năng
│
├── 💻 02-FIRMWARE/              # Code cho ESP32
│   ├── esp32-main/
│   │   ├── src/
│   │   │   ├── main.cpp                # Code chính
│   │   │   ├── config.h                # Cấu hình WiFi, MQTT
│   │   │   ├── sensors.cpp             # Xử lý cảm biến
│   │   │   ├── actuators.cpp           # Xử lý thiết bị
│   │   │   ├── mqtt_handler.cpp        # Giao tiếp MQTT
│   │   │   └── utils.cpp               # Hàm hỗ trợ
│   │   │
│   │   ├── include/
│   │   │   ├── sensors.h
│   │   │   ├── actuators.h
│   │   │   └── mqtt_handler.h
│   │   │
│   │   ├── platformio.ini               # PlatformIO config
│   │   ├── CMakeLists.txt               # Build config
│   │   └── README.md                    # Hướng dẫn build
│   │
│   ├── esp32-floor0/                    # Code cho tầng trệt
│   │   └── (tương tự cấu trúc trên)
│   │
│   ├── esp32-floor1/                    # Code cho tầng 1
│   │   └── (tương tự cấu trúc trên)
│   │
│   ├── esp32-rooftop/                   # Code cho sân thượng
│   │   └── (tương tự cấu trúc trên)
│   │
│   ├── libraries/                       # Custom libraries
│   │   └── SmartHomeLib/
│   │
│   └── tests/
│       ├── unit-tests/
│       └── integration-tests/
│
├── 🐍 03-BACKEND/               # Code Python trên Hub
│   ├── smart-home-hub/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py                 # Flask app chính
│   │   │   ├── config.py               # Cấu hình ứng dụng
│   │   │   ├── models.py               # Database models
│   │   │   └── utils.py                # Hàm tiện ích
│   │   │
│   │   ├── services/
│   │   │   ├── mqtt_service.py         # Quản lý MQTT
│   │   │   ├── rule_engine.py          # Logic tự động hóa
│   │   │   ├── database_service.py     # Quản lý database
│   │   │   ├── cloud_gateway.py        # Kết nối cloud
│   │   │   └── notification_service.py # Cảnh báo
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── api.py                  # API endpoints
│   │   │   ├── dashboard.py            # Dashboard routes
│   │   │   └── websocket.py            # WebSocket real-time
│   │   │
│   │   ├── static/                     # Static files
│   │   │   ├── css/
│   │   │   │   ├── style.css
│   │   │   │   └── responsive.css
│   │   │   ├── js/
│   │   │   │   ├── main.js
│   │   │   │   ├── mqtt-client.js
│   │   │   │   ├── chart.js
│   │   │   │   └── websocket.js
│   │   │   └── images/
│   │   │       └── icons/
│   │   │
│   │   ├── templates/                  # HTML templates
│   │   │   ├── base.html
│   │   │   ├── dashboard.html
│   │   │   ├── devices.html
│   │   │   ├── automation.html
│   │   │   ├── settings.html
│   │   │   └── login.html
│   │   │
│   │   ├── database/
│   │   │   ├── schema.sql              # Database schema
│   │   │   └── init.py                 # Database initialization
│   │   │
│   │   ├── config/
│   │   │   ├── mosquitto.conf          # Config MQTT Broker
│   │   │   ├── hostapd.conf            # Config WiFi AP
│   │   │   ├── dnsmasq.conf            # DNS config
│   │   │   └── systemd/                # Systemd service files
│   │   │
│   │   ├── tests/
│   │   │   ├── test_mqtt.py
│   │   │   ├── test_rules.py
│   │   │   ├── test_api.py
│   │   │   └── test_database.py
│   │   │
│   │   ├── logs/                       # Thư mục logs
│   │   │   ├── app.log
│   │   │   ├── mqtt.log
│   │   │   └── rules.log
│   │   │
│   │   ├── requirements.txt            # Python dependencies
│   │   ├── setup.py                    # Setup script
│   │   ├── README.md                   # Hướng dẫn
│   │   └── .env.example                # Environment variables
│   │
│   └── scripts/
│       ├── setup-hub.sh                # Script setup Orange Pi
│       ├── install-dependencies.sh     # Cài đặt dependencies
│       ├── start-services.sh           # Khởi động dịch vụ
│       └── backup-database.sh          # Sao lưu dữ liệu
│
├── 🌐 04-FRONTEND/              # Dashboard web
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Sidebar.js
│   │   │   ├── DeviceCard.js
│   │   │   ├── Chart.js
│   │   │   ├── Modal.js
│   │   │   └── NotificationToast.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Devices.js
│   │   │   ├── Automation.js
│   │   │   ├── History.js
│   │   │   ├── Settings.js
│   │   │   └── Status.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                  # API calls
│   │   │   └── websocket.js            # WebSocket connection
│   │   │
│   │   ├── styles/
│   │   │   ├── main.css
│   │   │   ├── responsive.css
│   │   │   └── themes.css
│   │   │
│   │   ├── utils/
│   │   │   ├── chart-utils.js
│   │   │   ├── format-utils.js
│   │   │   └── time-utils.js
│   │   │
│   │   └── App.js
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── package.json
│   ├── README.md
│   └── .env.example
│
├── ☁️ 05-CLOUD/                 # Cloud integration (optional)
│   ├── firebase/
│   │   ├── config.json
│   │   ├── rules.json                  # Firebase rules
│   │   └── functions/                  # Cloud functions
│   │
│   └── aws/
│       ├── config.json
│       └── lambda-functions/
│
├── 📚 06-DOCUMENTATION/         # Tài liệu
│   ├── User-Guide.md                   # Hướng dẫn sử dụng
│   ├── Developer-Guide.md              # Hướng dẫn dev
│   ├── API-Reference.md                # Tài liệu API
│   ├── MQTT-Topics.md                  # Danh sách MQTT topics
│   ├── Architecture-Decisions.md       # Quyết định kiến trúc
│   ├── Setup-Guide.md                  # Hướng dẫn setup từ đầu
│   ├── Troubleshooting.md              # Xử lý sự cố
│   ├── Database-Schema.md              # Schema database
│   └── Installation.md                 # Cài đặt toàn hệ thống
│
├── 🧪 07-TESTING/               # Testing & QA
│   ├── unit-tests/
│   │   ├── test-sensors.py
│   │   ├── test-actuators.py
│   │   └── test-rules.py
│   │
│   ├── integration-tests/
│   │   ├── test-mqtt-flow.py
│   │   ├── test-api-endpoints.py
│   │   └── test-database.py
│   │
│   ├── e2e-tests/
│   │   ├── test-complete-flow.py
│   │   └── test-offline-mode.py
│   │
│   ├── performance-tests/
│   │   ├── test-load.py
│   │   └── test-latency.py
│   │
│   └── test-reports/
│       └── .gitkeep
│
├── 📊 08-DATA/                  # Dữ liệu & Database
│   ├── database/
│   │   └── smart_home.db               # SQLite database
│   │
│   ├── logs/
│   │   ├── app.log
│   │   ├── mqtt.log
│   │   ├── sensor-data.log
│   │   └── errors.log
│   │
│   ├── backups/
│   │   ├── database-backups/
│   │   └── config-backups/
│   │
│   └── exports/
│       ├── sensor-data-exports/
│       └── reports/
│
├── 🚀 09-DEPLOYMENT/            # Deployment & Operations
│   ├── docker/
│   │   ├── Dockerfile                  # Docker image
│   │   ├── docker-compose.yml          # Docker compose
│   │   └── .dockerignore
│   │
│   ├── scripts/
│   │   ├── deploy.sh                   # Deploy script
│   │   ├── rollback.sh                 # Rollback script
│   │   ├── health-check.sh             # Health check
│   │   ├── backup.sh                   # Backup script
│   │   └── cleanup.sh                  # Cleanup script
│   │
│   ├── systemd/
│   │   ├── smart-home-hub.service
│   │   ├── mosquitto.service
│   │   └── dashboard.service
│   │
│   ├── monitoring/
│   │   ├── prometheus.yml              # Prometheus config
│   │   └── alerting.yml                # Alert rules
│   │
│   └── README.md
│
├── 📝 10-NOTES/                 # Ghi chú & Học tập
│   ├── Learning-Log.md                 # Nhật ký học
│   ├── Issues-Found.md                 # Vấn đề gặp phải
│   ├── Solutions.md                    # Giải pháp
│   ├── Research-Notes.md               # Ghi chú nghiên cứu
│   └── Team-Meetings/
│       ├── 2026-04-26-Meeting.md
│       └── .gitkeep
│
├── 📈 11-REPORTS/               # Báo cáo & Thống kê
│   ├── Progress-Reports/
│   ├── Performance-Reports/
│   ├── Monthly-Summary/
│   └── Final-Report/
│
├── .gitignore
├── README.md                            # Tài liệu chính của project
├── LICENSE
└── CHANGELOG.md
```

---

## 📋 Chi Tiết Từng Thư Mục

### **00-PLANNING/** - Kế Hoạch
Tất cả những gì bạn cần TRƯỚC khi bắt đầu:
- **BOM.xlsx**: Danh sách mua hàng (linh kiện, giá tiền, nhà cung cấp)
- **Wiring-Diagram.pdf**: Sơ đồ đấu nối chi tiết
- **System-Architecture.pdf**: Kiến trúc tổng thể
- **Project-Schedule.md**: Lộ trình tuần by tuần

### **01-HARDWARE/** - Xây Dựng Phần Cứng
Quản lý phần cứng:
- Specs từng component
- Hướng dẫn lắp ráp (Assembly Guide)
- Ảnh thực tế (Wiring-Photos)
- Kiểm tra & test (Testing-Checklist)

### **02-FIRMWARE/** - Code C++ cho ESP32
```
esp32-main/          # Controller chính
├── src/             # Source code
├── include/         # Header files
├── tests/           # Unit tests
└── platformio.ini   # Build config

esp32-floor0/        # Tầng trệt
esp32-floor1/        # Tầng 1
esp32-rooftop/       # Sân thượng
```

### **03-BACKEND/** - Code Python trên Orange Pi
```
smart-home-hub/
├── app/             # Flask app
├── services/        # Business logic
├── routes/          # API endpoints
├── static/          # CSS, JS
├── templates/       # HTML
├── config/          # Cấu hình
├── tests/           # Tests
└── requirements.txt # Dependencies
```

### **04-FRONTEND/** - Dashboard Web
Giao diện web/app:
- React components
- API calls
- Real-time updates via WebSocket

### **05-CLOUD/** - Cloud Integration
Firebase, AWS, hoặc custom cloud

### **06-DOCUMENTATION/** - Tài Liệu
- User Guide: Cách dùng hệ thống
- Developer Guide: Cách phát triển
- API Reference: Danh sách API
- Setup Guide: Cài đặt từ đầu

### **07-TESTING/** - Test & QA
- Unit tests
- Integration tests
- E2E tests
- Performance tests

### **08-DATA/** - Dữ Liệu
- Database SQLite
- Logs từ hệ thống
- Backups
- Exports dữ liệu

### **09-DEPLOYMENT/** - Deployment
- Docker
- Systemd services
- Deploy scripts
- Monitoring

### **10-NOTES/** - Ghi Chú
- Learning log (ghi những gì học)
- Issues found (vấn đề gặp)
- Solutions (giải pháp)
- Meeting notes

### **11-REPORTS/** - Báo Cáo
- Progress reports (tiến độ)
- Performance reports (hiệu năng)
- Final report (báo cáo cuối)

---

## 🔄 Luồng Công Việc

```
1. PLANNING (Tuần 1)
   ├─ Quyết định hardware
   ├─ Thiết kế kiến trúc
   └─ Tạo BOM & schedule

2. HARDWARE (Tuần 2-3)
   ├─ Mua linh kiện
   ├─ Lắp ráp
   ├─ Test phần cứng
   └─ Chuẩn bị Orange Pi

3. FIRMWARE (Tuần 4-5)
   ├─ Code ESP32
   ├─ Test từng ESP32
   └─ Debug MQTT

4. BACKEND (Tuần 6-7)
   ├─ Setup Orange Pi
   ├─ Code Python backend
   ├─ Cài MQTT broker
   └─ Test API

5. FRONTEND (Tuần 8)
   ├─ Design dashboard
   ├─ Code HTML/JS
   └─ Real-time integration

6. INTEGRATION (Tuần 9)
   ├─ Test end-to-end
   ├─ Offline mode testing
   ├─ Performance testing
   └─ Bug fixing

7. DEPLOYMENT (Tuần 10)
   ├─ Production setup
   ├─ Documentation
   └─ Final demo
```

---

## 📌 File Quan Trọng Cần Tạo Đầu Tiên

1. **00-PLANNING/01-Hardware-Planning/BOM.xlsx**
   - Danh sách mua hàng + giá tiền

2. **00-PLANNING/02-Architecture/System-Architecture.pdf**
   - Kiến trúc tổng thể

3. **00-PLANNING/04-Timeline/Project-Schedule.md**
   - Lộ trình tuần by tuần

4. **02-FIRMWARE/esp32-main/platformio.ini**
   - Config build đầu tiên

5. **03-BACKEND/smart-home-hub/requirements.txt**
   - Dependencies Python

6. **06-DOCUMENTATION/Setup-Guide.md**
   - Hướng dẫn setup toàn bộ

---

## 🎯 Tips Quản Lý

✅ **Làm ngay:**
- Tạo BOM (bill of materials)
- Lên lộ trình tuần by tuần
- Setup git repository
- Tạo folder cơ bản

✅ **Giữ ngăn nắp:**
- Một file cho một vấn đề
- Tên file rõ ràng (không dùng "test", "new", "old")
- Commit code thường xuyên
- Cập nhật README

✅ **Tránh:**
- ❌ Lưu code ở Desktop
- ❌ Tên folder như "Backup", "Old", "Test"
- ❌ Mix code + tài liệu
- ❌ Quên commit message

---

## 📚 Tài Liệu Cần Chuẩn Bị

Sau khi tạo folder structure, bạn cần:

1. **README.md** - Tổng quan dự án
2. **BOM.xlsx** - Danh sách mua hàng
3. **System-Architecture.pdf** - Sơ đồ hệ thống
4. **API-Reference.md** - Danh sách API
5. **MQTT-Topics.md** - Danh sách topics MQTT
6. **Setup-Guide.md** - Hướng dẫn cài đặt
7. **Troubleshooting.md** - Xử lý sự cố

---

**Bạn sẵn sàng tạo folder structure này chưa?** 🚀
