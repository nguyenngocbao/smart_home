#pragma once

// ================================================================
//  ESP32 #2 — SÂN THƯỢNG  (esp2-rooftop)
//  Nhóm: Trần Kim Phương · Lê Đức Ngọc
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 1 : Tưới ban công tự động → Soil GPIO34 + Relay GPIO26
//  Module 4 : Cửa sổ trời           → DHT22 GPIO4 + Rain GPIO35
//                                      + Servo GPIO13
// ================================================================

// ──── WiFi ───────────────────────────────────────────────────────
#define WIFI_SSID        "Ngoc Bao"      // <-- điền tên WiFi
#define WIFI_PASSWORD    "ngocbao787"   // <-- điền mật khẩu
#define WIFI_TIMEOUT_MS  15000

// ──── MQTT Broker ────────────────────────────────────────────────
//  LOCAL  (Mosquitto): tắt MQTT_TLS, port 1883
//  CLOUD  (HiveMQ)   : bật MQTT_TLS, đổi BROKER/USER/PASSWORD

//#define MQTT_TLS                         // ← bỏ comment để dùng HiveMQ Cloud

#ifdef MQTT_TLS
  #define MQTT_BROKER    "your-broker.s1.eu.hivemq.cloud"
  #define MQTT_PORT      8883
  #define MQTT_USER      "your-hivemq-user"
  #define MQTT_PASSWORD  "your-hivemq-password"
#else
  #define MQTT_BROKER    "192.168.1.4"
  #define MQTT_PORT      1883
  #define MQTT_USER      "smarthome"
  #define MQTT_PASSWORD  "mqtt_password"
#endif
#define MQTT_CLIENT_ID   "esp32-rooftop"
#define DEVICE_ID        "esp32-rooftop"
#define DEVICE_NAME      "ESP32-Rooftop"
#define FIRMWARE_VERSION "1.0.0"

// MQTT topics trạng thái chip
#define TOPIC_STATUS     "smarthome/status/esp32-rooftop"
#define TOPIC_HEARTBEAT  "smarthome/heartbeat/esp32-rooftop"

// ──── GPIO — Module 1: Tưới tự động ─────────────────────────────
#define PIN_SOIL          34    // Soil moisture capacitive (ADC1)
#define PIN_RELAY_PUMP    26    // Relay bơm nước (active LOW)

// ──── GPIO — Module 4: Cửa sổ trời ──────────────────────────────
#define PIN_DHT22          4    // DHT22 — nhiệt độ không khí
#define PIN_RAIN          35    // Rain sensor analog (ADC1)
#define PIN_SERVO_SKYLIGHT 13   // Servo MG995 mở/đóng cửa sổ trời
#define DHT_TYPE          DHT11

// ──── GPIO — Status LED ──────────────────────────────────────────
#define PIN_LED_STATUS     2

// ──── Calibration — Soil Moisture ────────────────────────────────
//  Capacitive sensor: ADC cao = khô, ADC thấp = ướt
//  Đo thực tế khi có phần cứng để hiệu chỉnh 2 giá trị này
#define SOIL_DRY_ADC     4095   // ADC khi đất khô hoàn toàn → 0%  (đo thực tế trong không khí)
#define SOIL_WET_ADC      800   // ADC khi đất ướt hoàn toàn → 100% (cần đo lại khi nhúng nước)

// ──── Calibration — Rain Sensor ──────────────────────────────────
//  ADC tăng khi có nước trên bề mặt sensor
#define RAIN_THRESHOLD    180   // ADC < ngưỡng này → đang mưa (khô≈273, ướt≈96)

// ──── Ngưỡng tự động — Module 1 ─────────────────────────────────
#define SOIL_DRY_PCT      30    // đất < 30%  → bật bơm tưới
#define SOIL_WET_PCT      70    // đất > 70%  → tắt bơm

// ──── Ngưỡng tự động — Module 4 ─────────────────────────────────
#define TEMP_HOT_OPEN    35.0   // °C — quá nóng → mở cửa sổ trời
#define TEMP_COOL_CLOSE  30.0   // °C — đủ mát   → đóng cửa sổ trời

// ──── Góc servo cửa sổ trời ──────────────────────────────────────
#define SKYLIGHT_OPEN_DEG    90  // mở hoàn toàn
#define SKYLIGHT_CLOSED_DEG   0  // đóng hoàn toàn

// ──── Chế độ giả lập (bật khi chưa có phần cứng) ────────────────
// Comment dòng này lại khi cắm sensor thật
//#define SIMULATE_SENSORS

// ──── Timing ─────────────────────────────────────────────────────
#define SENSOR_READ_MS    5000   // đọc sensor mỗi 5 giây
#define PUBLISH_MS       10000   // gửi MQTT mỗi 10 giây
#define HEARTBEAT_MS     30000   // heartbeat mỗi 30 giây
#define RECONNECT_MS      5000   // thử kết nối lại MQTT mỗi 5 giây
