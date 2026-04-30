// ================================================================
//  ESP32 #2 — SÂN THƯỢNG  [esp2-rooftop]
//  Nhóm: Lê Đức Ngọc · Trần Kim Phương
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 1: Tưới ban công tự động (Smart Irrigation Node)
//  Module 4: Cửa sổ trời chống nóng & mưa (Skylight Defense)
//
//  Cài libraries trong Arduino IDE (Tools → Library Manager):
//    □ PubSubClient      by Nick O'Leary
//    □ DHT sensor library by Adafruit
//    □ Adafruit Unified Sensor
//    □ ArduinoJson       by Benoit Blanchon
//    □ ESP32Servo        by Kevin Harrington
//
//  Trước khi nạp → mở config.h và sửa 3 dòng:
//    WIFI_SSID, WIFI_PASSWORD, MQTT_BROKER
// ================================================================

#include <WiFi.h>
#include "config.h"
#include "wifi_mqtt.h"
#include "module1_tuoi.h"
#include "module4_cua_troi.h"

// Bộ đếm thời gian (millis)
static unsigned long tSensor    = 0;
static unsigned long tPublish   = 0;
static unsigned long tHeartbeat = 0;
static unsigned long tReconnect = 0;

// Dữ liệu cảm biến hiện tại
static int   soilPct   = 0;
static float temp      = -999.0;
static bool  isRaining = false;

// ================================================================
//  SETUP — chạy một lần khi cấp điện
// ================================================================
void setup() {
    Serial.begin(115200);
    delay(500);

    pinMode(PIN_LED_STATUS, OUTPUT);
    digitalWrite(PIN_LED_STATUS, LOW);

    Serial.println("\n================================================================");
    Serial.printf("  %s  v%s  [%s]\n", DEVICE_NAME, FIRMWARE_VERSION, DEVICE_ID);
    Serial.println("  Module 1: Tuoi ban cong tu dong");
    Serial.println("  Module 4: Cua so troi chong nong & mua");
    Serial.println("================================================================\n");

    tuoi_init();       // Module 1: khởi tạo Soil + Relay bơm
    cuaTroi_init();    // Module 4: khởi tạo DHT22 + Rain + Servo
    wifi_connect();    // kết nối WiFi
    mqtt_connect();    // kết nối MQTT broker

    Serial.println("\n[Setup] Hoan tat — bat dau vong lap chinh\n");
}

// ================================================================
//  LOOP — chạy liên tục
// ================================================================
void loop() {
    unsigned long now = millis();

    // ── Kiểm tra WiFi, tự kết nối lại nếu mất ──────────────────
    if (WiFi.status() != WL_CONNECTED) {
        digitalWrite(PIN_LED_STATUS, LOW);
        Serial.println("[WiFi] Mat ket noi — dang ket noi lai...");
        wifi_connect();
        return;
    }

    // ── Kiểm tra MQTT, tự kết nối lại nếu mất ──────────────────
    if (!mqtt_isConnected() && now - tReconnect >= RECONNECT_MS) {
        tReconnect = now;
        Serial.println("[MQTT] Mat ket noi — dang ket noi lai...");
        mqtt_connect();
    }

    // ── Đọc cảm biến mỗi 5 giây ────────────────────────────────
    if (now - tSensor >= SENSOR_READ_MS) {
        tSensor = now;

        // Module 1: đọc độ ẩm đất
        soilPct   = tuoi_readSoil();
        isRaining = cuaTroi_readRain();

        // Module 4: đọc nhiệt độ
        temp = cuaTroi_readTemp();

        // In tóm tắt trạng thái ra Serial Monitor
        Serial.println("----------------------------------");
        Serial.printf("[Status] Dat=%d%%  Nhiet=%.1f°C  Mua=%s  Bom=%s  CuaTroi=%s\n",
                      soilPct, temp,
                      isRaining       ? "CO"   : "KHONG",
                      tuoi_getPump()  ? "BAT"  : "TAT",
                      cuaTroi_isOpen()? "MO"   : "DONG");
        Serial.println("----------------------------------");
    }

    // ── Gửi dữ liệu lên MQTT mỗi 10 giây ───────────────────────
    if (mqtt_isConnected() && now - tPublish >= PUBLISH_MS) {
        tPublish = now;
        tuoi_publish(soilPct);               // Module 1: gửi độ ẩm đất + bơm
        cuaTroi_publish(temp, isRaining);    // Module 4: gửi nhiệt độ + mưa + cửa trời
    }

    // ── Gửi heartbeat mỗi 30 giây ───────────────────────────────
    if (mqtt_isConnected() && now - tHeartbeat >= HEARTBEAT_MS) {
        tHeartbeat = now;
        mqtt_publishHeartbeat();
    }

    mqtt_loop();   // xử lý gói tin MQTT đến (lệnh từ Hub)
    delay(10);
}
