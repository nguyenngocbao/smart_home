#pragma once

// ================================================================
//  ESP32 #2 — SÂN THƯỢNG  (esp2-rooftop)
//  Nhóm: Trần Kim Phương · Lê Đức Ngọc
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 1 : Tưới ban công tự động → Soil GPIO34 + Relay GPIO26
//  Module 3 : Đèn sân thượng        → Relay GPIO27 (light2, 1 zone)
//  Module 4 : Cửa sổ trời          → Rain GPIO35 + Servo GPIO13
//             (DHT22 đã chuyển xuống esp1)
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
#define MQTT_CLIENT_ID   "esp32-rooftop"
#define DEVICE_ID        "esp32-rooftop"
#define DEVICE_NAME      "ESP32-Rooftop"
#define FIRMWARE_VERSION "1.0.0"

#define TOPIC_STATUS     "smarthome/status/esp32-rooftop"
#define TOPIC_HEARTBEAT  "smarthome/heartbeat/esp32-rooftop"

// ──── GPIO — Module 1: Tưới tự động ─────────────────────────────
#define PIN_SOIL          34    // Soil moisture (ADC1)
#define PIN_RELAY_PUMP    26    // Relay bơm (active LOW)

// ──── GPIO — Module 3: Đèn sân thượng (light2) ───────────────────
#define PIN_RELAY_LIGHT2  27    // Relay đèn sân thượng (active LOW)

// ──── GPIO — Module 4: Cửa sổ trời (rain-only, không có DHT22) ──
#define PIN_RAIN          35    // Rain sensor (ADC1)
#define PIN_SERVO_SKYLIGHT 13   // Servo MG995

// ──── GPIO — Status LED ──────────────────────────────────────────
#define PIN_LED_STATUS     2

// ──── Calibration — Soil Moisture ────────────────────────────────
#define SOIL_DRY_ADC     4095
#define SOIL_WET_ADC      1500

// ──── Calibration — Rain Sensor ──────────────────────────────────
#define RAIN_THRESHOLD    2000

// ──── Ngưỡng tự động — Module 1 ─────────────────────────────────
#define SOIL_DRY_PCT      30
#define SOIL_WET_PCT      70

// ──── Góc servo cửa sổ trời ──────────────────────────────────────
#define SKYLIGHT_OPEN_DEG    0
#define SKYLIGHT_CLOSED_DEG   90

// ──── Timing ─────────────────────────────────────────────────────
#define SENSOR_READ_MS    5000
#define PUBLISH_MS       10000
#define HEARTBEAT_MS     30000
#define RECONNECT_MS      5000
