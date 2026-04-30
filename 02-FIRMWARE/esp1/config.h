#pragma once

// ================================================================
//  ESP32 #1 — PHÒNG NGỦ  (esp1-bedroom)
//  Nhóm: Trần Kim Phương · Lê Đức Ngọc
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 2 : Rèm cửa thông minh  → LDR GPIO34 + Servo GPIO13
//  Module 3 : Đèn chiếu sáng      → Relay GPIO26 (đèn 1), GPIO27 (đèn 2)
// ================================================================

// ──── WiFi ───────────────────────────────────────────────────────
#define WIFI_SSID        "Ngoc Bao"
#define WIFI_PASSWORD    "ngocbao787"
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
#define MQTT_CLIENT_ID   "esp32-bedroom"
#define DEVICE_ID        "esp32-bedroom"
#define DEVICE_NAME      "ESP32-Bedroom"
#define FIRMWARE_VERSION "1.0.0"

// MQTT topics trạng thái chip
#define TOPIC_STATUS     "smarthome/status/esp32-bedroom"
#define TOPIC_HEARTBEAT  "smarthome/heartbeat/esp32-bedroom"

// ──── GPIO — Module 2: Rèm cửa ──────────────────────────────────
#define PIN_LDR            34    // LDR (ADC1 — an toàn khi WiFi bật)
#define PIN_SERVO_CURTAIN  13    // Servo SG90 / MG996R

// ──── GPIO — Module 3: Đèn chiếu sáng ───────────────────────────
#define PIN_RELAY_LIGHT1   26    // Relay đèn zone 1  (active LOW)
#define PIN_RELAY_LIGHT2   27    // Relay đèn zone 2  (active LOW)

// ──── GPIO — Status LED ──────────────────────────────────────────
#define PIN_LED_STATUS      2    // LED on-board (WiFi/MQTT status)

// ──── Calibration LDR ────────────────────────────────────────────
//  ADC = 4095 → tối hoàn toàn  |  ADC = 0 → sáng hoàn toàn
#define LDR_DARK_ADC     4095
#define LDR_BRIGHT_ADC      0

// ──── Ngưỡng tự động — Module 2 ─────────────────────────────────
#define CURTAIN_OPEN_THRESHOLD  80  // ánh sáng > 80% → quá chói → đóng rèm
#define CURTAIN_CLOSE_THRESHOLD 20  // ánh sáng < 20% → quá tối  → mở rèm

// ──── Góc servo rèm ──────────────────────────────────────────────
#define CURTAIN_SERVO_OPEN_DEG   120   // rèm mở hoàn toàn
#define CURTAIN_SERVO_CLOSE_DEG   0   // rèm đóng hoàn toàn

// ──── Timing ─────────────────────────────────────────────────────
#define SENSOR_READ_MS    5000    // đọc sensor mỗi 5 giây
#define PUBLISH_MS       10000    // gửi MQTT mỗi 10 giây
#define HEARTBEAT_MS     30000    // heartbeat mỗi 30 giây
#define RECONNECT_MS      5000    // thử kết nối lại MQTT mỗi 5 giây
