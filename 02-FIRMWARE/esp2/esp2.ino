// ================================================================
//  ESP32 #2 — SÂN THƯỢNG  [esp2-rooftop]
//  Nhóm: Trần Kim Phương · Lê Đức Ngọc
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 1: Tưới ban công tự động (Soil GPIO34 + Relay GPIO26)
//  Module 3: Đèn sân thượng (Relay GPIO27 — light2)
//  Module 4: Cửa sổ trời — rain only (Rain GPIO35 + Servo GPIO13)
//             (DHT22 đã chuyển xuống esp1)
//
//  Cài libraries trong Arduino IDE (Tools → Library Manager):
//    □ PubSubClient      by Nick O'Leary
//    □ ArduinoJson       by Benoit Blanchon
//    □ ESP32Servo        by Kevin Harrington
// ================================================================

#include <WiFi.h>
#include "config.h"
#include "wifi_mqtt.h"
#include "module1_tuoi.h"
#include "module3_den.h"
#include "module4_cua_troi.h"

static unsigned long tSensor    = 0;
static unsigned long tPublish   = 0;
static unsigned long tHeartbeat = 0;
static unsigned long tReconnect = 0;

static int  soilPct   = 0;
static bool isRaining = false;

// ================================================================
void setup() {
    Serial.begin(115200);
    delay(500);

    pinMode(PIN_LED_STATUS, OUTPUT);
    digitalWrite(PIN_LED_STATUS, LOW);

    Serial.println("\n================================================================");
    Serial.printf("  %s  v%s  [%s]\n", DEVICE_NAME, FIRMWARE_VERSION, DEVICE_ID);
    Serial.println("  Module 1: Tuoi ban cong tu dong (Soil + Relay pump)");
    Serial.println("  Module 3: Den san thuong (Relay GPIO27 — light2)");
    Serial.println("  Module 4: Cua so troi (Rain + Servo)");
    Serial.println("================================================================\n");

    tuoi_init();       // Module 1
    den_init();        // Module 3
    cuaTroi_init();    // Module 4
    wifi_connect();
    mqtt_connect();

    Serial.println("\n[Setup] Hoan tat — bat dau vong lap chinh\n");
}

// ================================================================
void loop() {
    unsigned long now = millis();

    if (WiFi.status() != WL_CONNECTED) {
        digitalWrite(PIN_LED_STATUS, LOW);
        Serial.println("[WiFi] Mat ket noi — dang ket noi lai...");
        wifi_connect();
        return;
    }

    if (!mqtt_isConnected() && now - tReconnect >= RECONNECT_MS) {
        tReconnect = now;
        mqtt_connect();
    }

    // Đọc sensor mỗi 5 giây
    if (now - tSensor >= SENSOR_READ_MS) {
        tSensor = now;
        soilPct   = tuoi_readSoil();
        isRaining = cuaTroi_readRain();

        Serial.println("----------------------------------");
        Serial.printf("[Status] Dat=%d%%  Mua=%s  Bom=%s  Den2=%s  CuaTroi=%s\n",
                      soilPct,
                      isRaining        ? "CO"   : "KHONG",
                      tuoi_getPump()   ? "BAT"  : "TAT",
                      den_getLight2()  ? "BAT"  : "TAT",
                      cuaTroi_isOpen() ? "MO"   : "DONG");
        Serial.println("----------------------------------");
    }

    // Gửi MQTT mỗi 10 giây
    if (mqtt_isConnected() && now - tPublish >= PUBLISH_MS) {
        tPublish = now;
        tuoi_publish(soilPct);        // Module 1
        den_publish();                // Module 3
        cuaTroi_publish(isRaining);   // Module 4
    }

    if (mqtt_isConnected() && now - tHeartbeat >= HEARTBEAT_MS) {
        tHeartbeat = now;
        mqtt_publishHeartbeat();
    }

    mqtt_loop();
    delay(10);
}
