# 🚀 Quick Start Guide - Smart Home Project Setup

**Chuẩn bị dự án Smart Home của bạn chỉ trong 30 phút!**

---

## 📋 Checklist Khởi Động

### **Bước 1: Tạo Cấu Trúc Thư Mục (5 phút)**

```bash
# Chạy script tạo folder tự động
bash create-project-structure.sh
```

✅ Điều này sẽ tạo ra:
- ✓ 11 thư mục chính
- ✓ 100+ file placeholder
- ✓ .gitignore config
- ✓ README.md template

---

### **Bước 2: Điền Thông Tin Cơ Bản (10 phút)**

**Chỉnh sửa các file này:**

#### **a) Bill of Materials (BOM)**
```bash
# Copy BOM template
cp BOM-TEMPLATE.md 00-PLANNING/01-Hardware-Planning/BOM.md

# Mở và điền:
# - Thêm link mua hàng
# - Cập nhật giá tiền hiện tại
# - Mark items để order
```

Nội dung cần điền:
- ✏️ Linh kiện nào cần mua
- ✏️ Giá hiện tại (Shopee/Lazada)
- ✏️ Nhà cung cấp
- ✏️ Ghi chú đặc biệt

#### **b) Project Schedule**
```bash
# Tạo file
cat > 00-PLANNING/04-Timeline/Project-Schedule.md << 'EOF'
# Lộ Trình Dự Án - Smart Home

## Tuần 1: Kế Hoạch & Mua Hàng
- [ ] Hoàn thành BOM
- [ ] Order hardware (Phase 1)
- [ ] Thiết kế system architecture
- [ ] Setup git repository

## Tuần 2-3: Lắp Ráp & Test Hardware
- [ ] Nhận & kiểm tra hàng
- [ ] Lắp ráp ESP32
- [ ] Test cảm biến
- [ ] Chuẩn bị Orange Pi

## Tuần 4-5: Firmware ESP32
- [ ] Setup PlatformIO
- [ ] Code basic WiFi
- [ ] Code MQTT client
- [ ] Test từng ESP32

## Tuần 6-7: Backend Python
- [ ] Setup Orange Pi OS
- [ ] Cài Mosquitto MQTT
- [ ] Code Flask backend
- [ ] Test API endpoints

## Tuần 8: Frontend Dashboard
- [ ] Design UI
- [ ] Code HTML/CSS/JS
- [ ] WebSocket integration
- [ ] Real-time updates

## Tuần 9: Integration & Testing
- [ ] End-to-end testing
- [ ] Offline mode test
- [ ] Performance test
- [ ] Bug fixes

## Tuần 10: Deployment
- [ ] Production setup
- [ ] Write documentation
- [ ] Final demo
- [ ] Submit project

EOF
```

#### **c) Update README.md**
```bash
# Edit README.md và cập nhật:
# - Tên nhóm
# - Địa chỉ dự án
# - Ngày bắt đầu
# - Link documentation
```

---

### **Bước 3: Git Repository (5 phút)**

```bash
# Initialize git
git init
git config user.name "Your Name"
git config user.email "your@email.com"

# Add files
git add .
git commit -m "Initial commit: project structure setup"

# (Optional) Tạo repo trên GitHub
# https://github.com/new
# git remote add origin https://github.com/username/smart-home-iot.git
# git push -u origin main
```

---

### **Bước 4: Tạo Development Environment (10 phút)**

#### **Python Environment (Cho Backend)**
```bash
# Tạo virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows

# Install basic packages
pip install flask paho-mqtt sqlalchemy

# Save dependencies
pip freeze > 03-BACKEND/smart-home-hub/requirements.txt
```

#### **Arduino/PlatformIO (Cho Firmware)**
```bash
# Install VS Code extension: "PlatformIO IDE"
# Hoặc install CLI:
pip install platformio

# Initialize project
cd 02-FIRMWARE/esp32-main
pio project init --board esp32doit-devkit-v1
```

---

## 📚 Tài Liệu Cần Đọc Ngay

Theo thứ tự ưu tiên:

| # | File | Mục Đích | Thời Gian |
|---|------|---------|---------|
| 1 | **PROJECT_STRUCTURE.md** | Hiểu cấu trúc folder | 15 min |
| 2 | **BOM-TEMPLATE.md** | Lên danh sách mua | 20 min |
| 3 | **README.md** | Tổng quan dự án | 10 min |
| 4 | **00-PLANNING/** | Kế hoạch chi tiết | 30 min |

---

## 🛠️ Tools Cần Cài Đặt

### **Bắt Buộc**

```bash
# 1. Git
brew install git  # Mac
# hoặc tải từ https://git-scm.com

# 2. Python 3.8+
python3 --version  # Check version
pip install --upgrade pip

# 3. VS Code
# Download từ https://code.visualstudio.com

# 4. Arduino IDE hoặc PlatformIO
pip install platformio
# hoặc VS Code Extension: PlatformIO IDE
```

### **Tùy Chọn (Nhưng Nên Cài)**

```bash
# Node.js (cho frontend)
node --version
npm --version

# Mosquitto Client (test MQTT)
brew install mosquitto  # Mac
# hoặc
sudo apt install mosquitto-clients  # Linux

# SQLite3 (database)
sqlite3 --version
```

---

## 🎯 Quy Trình Hàng Ngày

### **Daily Workflow**

```bash
# 1. Start day - Activate environment
source venv/bin/activate

# 2. Commit changes
git add .
git commit -m "Progress: [Feature/Bug Fix]"

# 3. End day - Push to GitHub
git push

# 4. Update learning log
echo "- Completed: [Task]" >> 10-NOTES/Learning-Log.md
```

---

## 📌 File Cần Tạo/Điền Ngay

Priority 1 (Tuần 1):
- [ ] **BOM.md** - Danh sách mua
- [ ] **Project-Schedule.md** - Lộ trình
- [ ] **System-Architecture.pdf** - Kiến trúc
- [ ] **README.md** - Tài liệu chính
- [ ] **.git** - Repository

Priority 2 (Tuần 2):
- [ ] **Assembly-Guide.md** - Hướng dẫn lắp
- [ ] **Setup-Guide.md** - Cài đặt từ đầu
- [ ] **API-Reference.md** - Danh sách API
- [ ] **platformio.ini** - Config build
- [ ] **requirements.txt** - Python deps

---

## 💡 Tips & Best Practices

### ✅ Làm Ngay

1. **Tạo git repo từ lúc bắt đầu**
   ```bash
   git init
   git add .
   git commit -m "Initial setup"
   ```

2. **Commit thường xuyên** (ít nhất 1 lần/ngày)
   ```bash
   git commit -m "Progress: Completed X feature"
   ```

3. **Cập nhật Learning Log**
   ```bash
   echo "- Learned: MQTT basics" >> 10-NOTES/Learning-Log.md
   ```

4. **Backup code hàng tuần**
   ```bash
   # Push to GitHub
   git push
   ```

### ❌ Tránh

- ❌ Lưu code ở Desktop (use git!)
- ❌ Quên commit message (dùng clear messages)
- ❌ Mix code + docs (tách riêng folder)
- ❌ Quên .gitignore (sẽ push file lớn)

---

## 🚨 Troubleshooting

### **Problem: "permission denied" khi chạy script**
```bash
# Solution
chmod +x create-project-structure.sh
bash create-project-structure.sh
```

### **Problem: Python virtual environment không activate**
```bash
# Check path
which python3

# Tạo lại venv
python3 -m venv venv
source venv/bin/activate
```

### **Problem: Git không recognize files**
```bash
# Check status
git status

# Add all
git add .

# Commit
git commit -m "message"
```

---

## 📞 Support & Help

**Khi gặp vấn đề:**

1. Check **06-DOCUMENTATION/Troubleshooting.md**
2. Search **10-NOTES/Issues-Found.md**
3. Google error message
4. Email **Thầy Khang** hoặc **team Telegram**

---

## 📊 Progress Tracking

### **Cách Track Progress**

```bash
# Method 1: Update README
# Edit main README.md, update status

# Method 2: Use GitHub Issues
# Create issue cho mỗi task
# Mark complete khi done

# Method 3: Learning Log
# Daily notes trong 10-NOTES/Learning-Log.md

# Method 4: Git commits
# Good commits = clear progress
git log --oneline
```

### **Example Learning Log**
```markdown
# Learning Log - Smart Home Project

## Week 1
### Day 1 (2026-04-26)
- ✅ Created project structure
- ✅ Setup git repository
- 📚 Learned about MQTT basics
- 🔧 Installed PlatformIO
- ⏳ TODO: Complete BOM

### Day 2 (2026-04-27)
- ✅ Completed BOM
- ✅ Ordered hardware Phase 1
- 📚 Read ESP32 datasheet
- 🐛 Fixed platformio config
- ⏳ TODO: Design system architecture
```

---

## 🎓 Learning Resources

### **Recommended Resources**

1. **MQTT**
   - https://mqtt.org/
   - https://www.hivemq.com/mqtt/

2. **ESP32**
   - https://docs.espressif.com/projects/esp-idf/
   - https://randomnerdtutorials.com/

3. **Flask**
   - https://flask.palletsprojects.com/
   - https://realpython.com/flask-by-example/

4. **IoT Architecture**
   - "Internet of Things Protocols and Standards" by Olivier Hersent
   - YouTube channels: GreatScott, Andreas Spiess

---

## ✨ Next Steps

**Sau khi hoàn thành Quick Start:**

1. ✅ Hoàn thành BOM.md
2. ✅ Order hardware
3. ✅ Tạo System Architecture document
4. ✅ Begin detailed planning
5. ✅ Start development (Week 2)

---

## 📅 Timeline Summary

| Week | Main Task | Status |
|------|-----------|--------|
| 1 | Planning + BOM | 🟢 Now |
| 2-3 | Hardware setup | ⏳ Next |
| 4-5 | Firmware | ⏳ Soon |
| 6-7 | Backend | ⏳ Soon |
| 8 | Frontend | ⏳ Later |
| 9 | Testing | ⏳ Later |
| 10 | Deployment | ⏳ Final |

---

## 🎉 Ready to Start?

```bash
# Run this command to get started:
bash create-project-structure.sh

# Then:
git init
git add .
git commit -m "Initial: Smart Home IoT project setup"

# Now you're ready! 🚀
```

---

**Questions?** Check 06-DOCUMENTATION/ folder or email Thầy Khang!

**Last Updated:** 2026-04-26
**Status:** Ready to Go! ✨
