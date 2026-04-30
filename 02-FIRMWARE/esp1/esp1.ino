// ================================================================
//  ESP32 #1 — PHÒNG NGỦ  [esp1-bedroom]
//  Nhóm: Lê Đức Ngọc · Trần Kim Phương
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 2: Rèm cửa thông minh (Smart Shading Control)
//  Module 3: Đèn chiếu sáng từ xa (Remote Lighting)
//
//  Cài libraries trong Arduino IDE (Tools → Library Manager):
//    □ PubSubClient      by Nick O'Leary
//    □ ArduinoJson       by Benoit Blanchon
//    □ ESP32Servo        by Kevin Harrington
//
//  Trước khi nạp → mở config.h và sửa 3 dòng:
//    WIFI_SSID, WIFI_PASSWORD, MQTT_BROKER
// ================================================================

#include <WiFi.h>
#include "config.h"
#include "wifi_mqtt.h"
#include "module2_rem.h"
#include "module3_den.h"

// Bộ đếm thời gian (millis)
static unsigned long tSensor    = 0;
static unsigned long tPublish   = 0;
static unsigned long tHeartbeat = 0;
static unsigned long tReconnect = 0;

static int lightPct = 0;   // độ sáng đọc từ LDR

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
    Serial.println("  Module 2: Rem cua thong minh");
    Serial.println("  Module 3: Den chieu sang tu xa");
    Serial.println("================================================================\n");

    rem_init();      // Module 2: khởi tạo LDR + Servo
    den_init();      // Module 3: khởi tạo Relay đèn
    wifi_connect();  // kết nối WiFi
    mqtt_connect();  // kết nối MQTT broker

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

        // Module 2: đọc ánh sáng LDR
        lightPct = rem_readLight();
    }

    // ── Gửi dữ liệu lên MQTT mỗi 10 giây ───────────────────────
    if (mqtt_isConnected() && now - tPublish >= PUBLISH_MS) {
        tPublish = now;
        rem_publish(lightPct);   // Module 2: gửi ánh sáng + vị trí rèm
        den_publish();           // Module 3: gửi trạng thái đèn
    }

    // ── Gửi heartbeat mỗi 30 giây ───────────────────────────────
    if (mqtt_isConnected() && now - tHeartbeat >= HEARTBEAT_MS) {
        tHeartbeat = now;
        mqtt_publishHeartbeat();
    }

    mqtt_loop();   // xử lý gói tin MQTT đến (lệnh từ Hub)
    delay(10);
}
