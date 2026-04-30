#!/bin/bash

# ============================================
# Smart Home IoT Project Structure Creator
# ============================================
# Script tạo toàn bộ folder structure
# Sử dụng: bash create-project-structure.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🏠 Creating Smart Home IoT Project Structure...${NC}"

# Create main directories
mkdir -p 00-PLANNING/{01-Hardware-Planning,02-Architecture,03-Requirements,04-Timeline}
mkdir -p 01-HARDWARE/{01-Components/{ESP32-Setup,Orange-Pi-Setup,Sensors-Actuators/{DHT22-Temp-Humidity,Rain-Sensor,Light-Sensor-LDR,Soil-Moisture,Servo-Motor,Relay-Module,Door-Sensor}},02-Assembly/Wiring-Photos,03-Testing}
mkdir -p 02-FIRMWARE/{esp32-main/{src,include,tests/{unit-tests,integration-tests}},esp32-floor0/{src,include},esp32-floor1/{src,include},esp32-rooftop/{src,include},libraries/SmartHomeLib}
mkdir -p 03-BACKEND/smart-home-hub/{app,services,routes,static/{css,js,images/icons},templates,database,config/systemd,tests,logs}
mkdir -p 03-BACKEND/scripts
mkdir -p 04-FRONTEND/{src/{components,pages,services,styles,utils},public}
mkdir -p 05-CLOUD/{firebase,aws/lambda-functions}
mkdir -p 06-DOCUMENTATION
mkdir -p 07-TESTING/{unit-tests,integration-tests,e2e-tests,performance-tests,test-reports}
mkdir -p 08-DATA/{database,logs,backups/{database-backups,config-backups},exports/{sensor-data-exports,reports}}
mkdir -p 09-DEPLOYMENT/{docker,scripts,systemd,monitoring}
mkdir -p 10-NOTES/Team-Meetings
mkdir -p 11-REPORTS/{Progress-Reports,Performance-Reports,Monthly-Summary,Final-Report}

echo -e "${GREEN}✓ Folders created successfully!${NC}\n"

# Create placeholder files
echo -e "${YELLOW}📝 Creating placeholder files...${NC}"

# 00-PLANNING files
touch 00-PLANNING/01-Hardware-Planning/BOM.xlsx
touch 00-PLANNING/01-Hardware-Planning/Component-List.md
touch 00-PLANNING/01-Hardware-Planning/Wiring-Diagram.pdf
touch 00-PLANNING/01-Hardware-Planning/Cost-Breakdown.xlsx
touch 00-PLANNING/02-Architecture/System-Architecture.pdf
touch 00-PLANNING/02-Architecture/Network-Diagram.png
touch 00-PLANNING/02-Architecture/Data-Flow.md
touch 00-PLANNING/02-Architecture/Device-Communication.md
touch 00-PLANNING/03-Requirements/Functional-Requirements.md
touch 00-PLANNING/03-Requirements/Non-Functional-Req.md
touch 00-PLANNING/03-Requirements/Use-Cases.md
touch 00-PLANNING/03-Requirements/Acceptance-Criteria.md
touch 00-PLANNING/04-Timeline/Project-Schedule.md
touch 00-PLANNING/04-Timeline/Milestones.xlsx
touch 00-PLANNING/04-Timeline/Risk-Assessment.md

# 01-HARDWARE files
touch 01-HARDWARE/01-Components/ESP32-Setup/Specifications.md
touch 01-HARDWARE/01-Components/ESP32-Setup/GPIO-Pinout.pdf
touch 01-HARDWARE/01-Components/ESP32-Setup/Power-Requirements.md
touch 01-HARDWARE/01-Components/Orange-Pi-Setup/OS-Installation.md
touch 01-HARDWARE/01-Components/Orange-Pi-Setup/Hardware-Specs.md
touch 01-HARDWARE/01-Components/Orange-Pi-Setup/GPIO-Reference.md
touch 01-HARDWARE/02-Assembly/Assembly-Guide.pdf
touch 01-HARDWARE/02-Assembly/Testing-Checklist.md
touch 01-HARDWARE/02-Assembly/Troubleshooting.md
touch 01-HARDWARE/03-Testing/Hardware-Tests.md
touch 01-HARDWARE/03-Testing/Sensor-Calibration.md
touch 01-HARDWARE/03-Testing/Power-Consumption.xlsx

# 02-FIRMWARE files
touch 02-FIRMWARE/esp32-main/src/main.cpp
touch 02-FIRMWARE/esp32-main/src/config.h
touch 02-FIRMWARE/esp32-main/src/sensors.cpp
touch 02-FIRMWARE/esp32-main/src/actuators.cpp
touch 02-FIRMWARE/esp32-main/src/mqtt_handler.cpp
touch 02-FIRMWARE/esp32-main/src/utils.cpp
touch 02-FIRMWARE/esp32-main/include/sensors.h
touch 02-FIRMWARE/esp32-main/include/actuators.h
touch 02-FIRMWARE/esp32-main/include/mqtt_handler.h
touch 02-FIRMWARE/esp32-main/platformio.ini
touch 02-FIRMWARE/esp32-main/CMakeLists.txt
touch 02-FIRMWARE/esp32-main/README.md

# 03-BACKEND files
touch 03-BACKEND/smart-home-hub/app/__init__.py
touch 03-BACKEND/smart-home-hub/app/main.py
touch 03-BACKEND/smart-home-hub/app/config.py
touch 03-BACKEND/smart-home-hub/app/models.py
touch 03-BACKEND/smart-home-hub/app/utils.py
touch 03-BACKEND/smart-home-hub/services/mqtt_service.py
touch 03-BACKEND/smart-home-hub/services/rule_engine.py
touch 03-BACKEND/smart-home-hub/services/database_service.py
touch 03-BACKEND/smart-home-hub/services/cloud_gateway.py
touch 03-BACKEND/smart-home-hub/services/notification_service.py
touch 03-BACKEND/smart-home-hub/routes/__init__.py
touch 03-BACKEND/smart-home-hub/routes/api.py
touch 03-BACKEND/smart-home-hub/routes/dashboard.py
touch 03-BACKEND/smart-home-hub/routes/websocket.py
touch 03-BACKEND/smart-home-hub/static/css/style.css
touch 03-BACKEND/smart-home-hub/static/css/responsive.css
touch 03-BACKEND/smart-home-hub/static/js/main.js
touch 03-BACKEND/smart-home-hub/static/js/mqtt-client.js
touch 03-BACKEND/smart-home-hub/static/js/chart.js
touch 03-BACKEND/smart-home-hub/static/js/websocket.js
touch 03-BACKEND/smart-home-hub/templates/base.html
touch 03-BACKEND/smart-home-hub/templates/dashboard.html
touch 03-BACKEND/smart-home-hub/templates/devices.html
touch 03-BACKEND/smart-home-hub/templates/automation.html
touch 03-BACKEND/smart-home-hub/templates/settings.html
touch 03-BACKEND/smart-home-hub/templates/login.html
touch 03-BACKEND/smart-home-hub/database/schema.sql
touch 03-BACKEND/smart-home-hub/database/init.py
touch 03-BACKEND/smart-home-hub/config/mosquitto.conf
touch 03-BACKEND/smart-home-hub/config/hostapd.conf
touch 03-BACKEND/smart-home-hub/config/dnsmasq.conf
touch 03-BACKEND/smart-home-hub/tests/test_mqtt.py
touch 03-BACKEND/smart-home-hub/tests/test_rules.py
touch 03-BACKEND/smart-home-hub/tests/test_api.py
touch 03-BACKEND/smart-home-hub/tests/test_database.py
touch 03-BACKEND/smart-home-hub/.gitkeep
touch 03-BACKEND/smart-home-hub/requirements.txt
touch 03-BACKEND/smart-home-hub/setup.py
touch 03-BACKEND/smart-home-hub/README.md
touch 03-BACKEND/smart-home-hub/.env.example
touch 03-BACKEND/scripts/setup-hub.sh
touch 03-BACKEND/scripts/install-dependencies.sh
touch 03-BACKEND/scripts/start-services.sh
touch 03-BACKEND/scripts/backup-database.sh

# 04-FRONTEND files
touch 04-FRONTEND/src/components/Navbar.js
touch 04-FRONTEND/src/components/Sidebar.js
touch 04-FRONTEND/src/components/DeviceCard.js
touch 04-FRONTEND/src/components/Chart.js
touch 04-FRONTEND/src/components/Modal.js
touch 04-FRONTEND/src/components/NotificationToast.js
touch 04-FRONTEND/src/pages/Dashboard.js
touch 04-FRONTEND/src/pages/Devices.js
touch 04-FRONTEND/src/pages/Automation.js
touch 04-FRONTEND/src/pages/History.js
touch 04-FRONTEND/src/pages/Settings.js
touch 04-FRONTEND/src/pages/Status.js
touch 04-FRONTEND/src/services/api.js
touch 04-FRONTEND/src/services/websocket.js
touch 04-FRONTEND/src/styles/main.css
touch 04-FRONTEND/src/styles/responsive.css
touch 04-FRONTEND/src/styles/themes.css
touch 04-FRONTEND/src/utils/chart-utils.js
touch 04-FRONTEND/src/utils/format-utils.js
touch 04-FRONTEND/src/utils/time-utils.js
touch 04-FRONTEND/src/App.js
touch 04-FRONTEND/public/index.html
touch 04-FRONTEND/public/favicon.ico
touch 04-FRONTEND/public/manifest.json
touch 04-FRONTEND/package.json
touch 04-FRONTEND/README.md
touch 04-FRONTEND/.env.example

# 05-CLOUD files
touch 05-CLOUD/firebase/config.json
touch 05-CLOUD/firebase/rules.json
touch 05-CLOUD/aws/config.json

# 06-DOCUMENTATION files
touch 06-DOCUMENTATION/User-Guide.md
touch 06-DOCUMENTATION/Developer-Guide.md
touch 06-DOCUMENTATION/API-Reference.md
touch 06-DOCUMENTATION/MQTT-Topics.md
touch 06-DOCUMENTATION/Architecture-Decisions.md
touch 06-DOCUMENTATION/Setup-Guide.md
touch 06-DOCUMENTATION/Troubleshooting.md
touch 06-DOCUMENTATION/Database-Schema.md
touch 06-DOCUMENTATION/Installation.md

# 07-TESTING files
touch 07-TESTING/unit-tests/.gitkeep
touch 07-TESTING/integration-tests/.gitkeep
touch 07-TESTING/e2e-tests/.gitkeep
touch 07-TESTING/performance-tests/.gitkeep
touch 07-TESTING/test-reports/.gitkeep

# 08-DATA files
touch 08-DATA/database/.gitkeep
touch 08-DATA/logs/.gitkeep
touch 08-DATA/backups/database-backups/.gitkeep
touch 08-DATA/backups/config-backups/.gitkeep
touch 08-DATA/exports/sensor-data-exports/.gitkeep
touch 08-DATA/exports/reports/.gitkeep

# 09-DEPLOYMENT files
touch 09-DEPLOYMENT/docker/Dockerfile
touch 09-DEPLOYMENT/docker/docker-compose.yml
touch 09-DEPLOYMENT/docker/.dockerignore
touch 09-DEPLOYMENT/scripts/deploy.sh
touch 09-DEPLOYMENT/scripts/rollback.sh
touch 09-DEPLOYMENT/scripts/health-check.sh
touch 09-DEPLOYMENT/scripts/backup.sh
touch 09-DEPLOYMENT/scripts/cleanup.sh
touch 09-DEPLOYMENT/systemd/smart-home-hub.service
touch 09-DEPLOYMENT/systemd/mosquitto.service
touch 09-DEPLOYMENT/systemd/dashboard.service
touch 09-DEPLOYMENT/monitoring/prometheus.yml
touch 09-DEPLOYMENT/monitoring/alerting.yml
touch 09-DEPLOYMENT/README.md

# 10-NOTES files
touch 10-NOTES/Learning-Log.md
touch 10-NOTES/Issues-Found.md
touch 10-NOTES/Solutions.md
touch 10-NOTES/Research-Notes.md
touch 10-NOTES/Team-Meetings/.gitkeep

# 11-REPORTS files
touch 11-REPORTS/Progress-Reports/.gitkeep
touch 11-REPORTS/Performance-Reports/.gitkeep
touch 11-REPORTS/Monthly-Summary/.gitkeep
touch 11-REPORTS/Final-Report/.gitkeep

# Root files
touch .gitignore
touch README.md
touch LICENSE
touch CHANGELOG.md

echo -e "${GREEN}✓ Placeholder files created!${NC}\n"

# Create .gitignore
cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
venv/
env/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
*.log

# Build
build/
dist/
*.egg-info/

# Database
*.db
*.sqlite3

# Backups
backups/*
*.backup

# Temporary
tmp/
temp/
*.tmp

# Logs
logs/*
*.log

# Config with secrets
config/secret.conf
.env.production

# OS specific
.AppleDouble
.LSOverride

EOF

echo -e "${GREEN}✓ .gitignore created!${NC}\n"

# Create initial README.md
cat > README.md << 'EOF'
# 🏠 Smart Home IoT - Nhà Thành Thị Eco-Smart Oasis

**Dự án:** Nhà Thành Thị - Garden Riverside Village
**Địa điểm:** Cầu Đình, Phường Long Phước, Quận 9, TP. Thủ Đức
**Giảng viên:** TS. Nguyễn Huỳnh Duy Khang
**Nhóm:** Lê Đức Ngọc, Trần Kim Phương

---

## 📋 Mô Tả Dự Án

Hệ thống IoT Smart Home hoàn chỉnh cho nhà phố đô thị với:
- ✅ Tự động hóa các thiết bị (đèn, quạt, tưới)
- ✅ Giám sát cảm biến (nhiệt độ, độ ẩm, ánh sáng)
- ✅ Dashboard local (offline mode)
- ✅ Kết nối cloud cho remote control
- ✅ Rule engine tự động hóa

---

## 🏗️ Cấu Trúc Dự Án

```
smart-home-project/
├── 00-PLANNING/          # Kế hoạch & thiết kế
├── 01-HARDWARE/          # Xây dựng phần cứng
├── 02-FIRMWARE/          # Code C++ cho ESP32
├── 03-BACKEND/           # Code Python trên Hub
├── 04-FRONTEND/          # Dashboard web
├── 05-CLOUD/             # Cloud integration
├── 06-DOCUMENTATION/     # Tài liệu
├── 07-TESTING/           # Tests & QA
├── 08-DATA/              # Database & Logs
├── 09-DEPLOYMENT/        # Deployment scripts
├── 10-NOTES/             # Ghi chú học tập
└── 11-REPORTS/           # Báo cáo tiến độ
```

**Chi tiết cấu trúc:** Xem `PROJECT_STRUCTURE.md`

---

## 🚀 Quick Start

### 1. Thiết lập ban đầu
```bash
# Clone repository
git clone <repository-url>
cd smart-home-project

# Tạo folder structure (nếu chưa có)
bash create-project-structure.sh

# Install dependencies
pip install -r 03-BACKEND/smart-home-hub/requirements.txt
```

### 2. Setup Hardware
- Xem `01-HARDWARE/01-Components/ESP32-Setup/Specifications.md`
- Xem `01-HARDWARE/02-Assembly/Assembly-Guide.pdf`

### 3. Setup Backend
```bash
cd 03-BACKEND/smart-home-hub
python main.py
```

### 4. Setup Dashboard
```bash
cd 04-FRONTEND
npm install
npm start
```

---

## 📚 Tài Liệu Quan Trọng

- **[Setup Guide](06-DOCUMENTATION/Setup-Guide.md)** - Hướng dẫn cài đặt toàn bộ
- **[API Reference](06-DOCUMENTATION/API-Reference.md)** - Danh sách API endpoints
- **[MQTT Topics](06-DOCUMENTATION/MQTT-Topics.md)** - Danh sách topics MQTT
- **[Troubleshooting](06-DOCUMENTATION/Troubleshooting.md)** - Xử lý sự cố
- **[Architecture Decisions](06-DOCUMENTATION/Architecture-Decisions.md)** - Quyết định kiến trúc

---

## 🔧 Công Nghệ Sử Dụng

### Hardware
- **Hub:** Orange Pi Zero 3 (2GB RAM)
- **Controller:** ESP32 × 3
- **Sensors:** DHT22, LDR, Rain Sensor, Soil Moisture, Door Sensor
- **Actuators:** Relay, Servo Motor, Solenoid

### Software
- **Firmware:** Arduino C++, PlatformIO
- **Backend:** Python Flask, Mosquitto MQTT
- **Frontend:** HTML/CSS/JavaScript
- **Database:** SQLite
- **Cloud:** Firebase / AWS (optional)

---

## 📊 Lộ Trình Dự Án

| Tuần | Nội Dung | Status |
|-----|---------|--------|
| 1 | Kế hoạch, mua hàng | 🟢 |
| 2-3 | Lắp ráp, test hardware | ⏳ |
| 4-5 | Code firmware ESP32 | ⏳ |
| 6-7 | Backend Python, MQTT | ⏳ |
| 8 | Dashboard frontend | ⏳ |
| 9 | Integration & testing | ⏳ |
| 10 | Deployment & demo | ⏳ |

---

## 👥 Thành Viên Nhóm

| Tên | Vai Trò |
|----|--------|
| Lê Đức Ngọc | Hardware Lead |
| Trần Kim Phương | Backend Lead |
| TS. Nguyễn Huỳnh Duy Khang | Giảng viên hướng dẫn |

---

## 📞 Liên Hệ & Support

- 📧 Email: `nngocbao090@gmail.com`
- 📱 GitHub Issues: [Link Issues]
- 📋 Wiki: [Link Wiki]

---

## 📝 License

MIT License - Xem `LICENSE` file

---

## 🙏 Cảm Ơn

Cảm ơn TS. Nguyễn Huỳnh Duy Khang và tất cả những người hỗ trợ dự án này!

---

**Last Updated:** 2026-04-26
**Version:** 0.1.0 (Initial Setup)

EOF

echo -e "${GREEN}✓ README.md created!${NC}\n"

# Print summary
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Project structure created successfully!${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📂 Folder Structure:${NC}"
echo "✓ 11 main directories created"
echo "✓ 100+ placeholder files created"
echo "✓ .gitignore configured"
echo "✓ README.md generated"
echo ""

echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Fill in BOM.xlsx with hardware list"
echo "2. Update PROJECT_STRUCTURE.md with your details"
echo "3. Create .git repository: git init"
echo "4. Start planning in 00-PLANNING/"
echo ""

echo -e "${YELLOW}📝 Important Files to Edit:${NC}"
echo "• 00-PLANNING/01-Hardware-Planning/BOM.xlsx"
echo "• 00-PLANNING/04-Timeline/Project-Schedule.md"
echo "• 06-DOCUMENTATION/Setup-Guide.md"
echo "• README.md"
echo ""

echo -e "${GREEN}Happy coding! 🎉${NC}\n"
