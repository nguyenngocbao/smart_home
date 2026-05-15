#pragma once

// ================================================================
//  ESP32 #1 — PHÒNG NGỦ  (esp1-bedroom)
//  Nhóm: Trần Kim Phương · Lê Đức Ngọc
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 2 : Rèm cửa thông minh  → LDR GPIO34 + Servo GPIO13
//  Module 3 : Đèn tầng 1          → Relay GPIO26 (light1, 1 zone)
//  Sensor   : Nhiệt độ phòng      → DHT22 GPIO4  (chuyển từ esp2)
// ================================================================

// ──── WiFi ───────────────────────────────────────────────────────
#define WIFI_SSID        "Ngoc Bao"
#define WIFI_PASSWORD    "ngocbao787"
#define WIFI_TIMEOUT_MS  15000

// ──── MQTT Broker ────────────────────────────────────────────────
#define MQTT_TLS                         // HiveMQ Cloud

#ifdef MQTT_TLS
  #define MQTT_BROKER    "fded182921f94059b52bc084fc607d3b.s1.eu.hivemq.cloud"
  #define MQTT_PORT      8883
  #define MQTT_USER      "smarthome"
  #define MQTT_PASSWORD  "Smarthome123"
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
#define PIN_SERVO_CURTAIN  13    // Servo SG90

// ──── GPIO — Module 3: Đèn tầng 1 ───────────────────────────────
#define PIN_RELAY_LIGHT1    26   // Relay đèn tầng 1 (active LOW)

// ──── GPIO — DHT22: Nhiệt độ phòng ngủ ──────────────────────────
#define PIN_DHT22           4    // DHT22 data pin (chuyển từ esp2)
#define DHT_TYPE          DHT22

// ──── GPIO — Status LED ──────────────────────────────────────────
#define PIN_LED_STATUS      2    // LED on-board (WiFi/MQTT status)

// ──── Calibration LDR ────────────────────────────────────────────
#define LDR_DARK_ADC     4095
#define LDR_BRIGHT_ADC      0

// ──── Ngưỡng tự động — Module 2 ─────────────────────────────────
#define CURTAIN_OPEN_THRESHOLD  80
#define CURTAIN_CLOSE_THRESHOLD 20

// ──── Góc servo rèm ──────────────────────────────────────────────
#define CURTAIN_SERVO_OPEN_DEG   120
#define CURTAIN_SERVO_CLOSE_DEG    0

// ──── Timing ─────────────────────────────────────────────────────
#define SENSOR_READ_MS    5000
#define PUBLISH_MS       10000
#define HEARTBEAT_MS     30000
#define RECONNECT_MS      5000
