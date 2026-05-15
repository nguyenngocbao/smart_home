// ================================================================
//  ESP32 #1 — PHÒNG NGỦ  [esp1-bedroom]
//  Nhóm: Trần Kim Phương · Lê Đức Ngọc
//  GVHD: TS. Nguyễn Huỳnh Duy Khang
//
//  Module 2: Rèm cửa thông minh (LDR GPIO34 + Servo GPIO13)
//  Module 3: Đèn tầng 1 (Relay GPIO26 — light1)
//  Sensor  : Nhiệt độ phòng ngủ — DHT22 GPIO4 (chuyển từ esp2)
//
//  Cài libraries trong Arduino IDE (Tools → Library Manager):
//    □ PubSubClient          by Nick O'Leary
//    □ ArduinoJson           by Benoit Blanchon
//    □ ESP32Servo            by Kevin Harrington
//    □ DHT sensor library    by Adafruit
//    □ Adafruit Unified Sensor
// ================================================================

#include <WiFi.h>
#include <DHT.h>
#include "config.h"
#include "wifi_mqtt.h"
#include "module2_rem.h"
#include "module3_den.h"

static DHT dht(PIN_DHT22, DHT_TYPE);

static unsigned long tSensor    = 0;
static unsigned long tPublish   = 0;
static unsigned long tHeartbeat = 0;
static unsigned long tReconnect = 0;

static int   lightPct = 0;
static float roomTemp = -999.0;

// ================================================================
void setup() {
    Serial.begin(115200);
    delay(500);

    pinMode(PIN_LED_STATUS, OUTPUT);
    digitalWrite(PIN_LED_STATUS, LOW);

    Serial.println("\n================================================================");
    Serial.printf("  %s  v%s  [%s]\n", DEVICE_NAME, FIRMWARE_VERSION, DEVICE_ID);
    Serial.println("  Module 2: Rem cua thong minh (LDR + Servo)");
    Serial.println("  Module 3: Den tang 1 (Relay GPIO26)");
    Serial.println("  Sensor  : Nhiet do phong ngu (DHT22 GPIO4)");
    Serial.println("================================================================\n");

    rem_init();        // Module 2
    den_init();        // Module 3
    dht.begin();       // DHT22
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

        lightPct = rem_readLight();

        float t = dht.readTemperature();
        if (!isnan(t)) roomTemp = t;
        else Serial.println("[DHT22] Loi doc nhiet do!");

        Serial.println("----------------------------------");
        Serial.printf("[Status] Anh sang=%d%%  Nhiet=%s°C  Den1=%s\n",
                      lightPct,
                      roomTemp != -999.0 ? String(roomTemp, 1).c_str() : "ERR",
                      den_getLight1() ? "BAT" : "TAT");
        Serial.println("----------------------------------");
    }

    // Gửi MQTT mỗi 10 giây
    if (mqtt_isConnected() && now - tPublish >= PUBLISH_MS) {
        tPublish = now;

        rem_publish(lightPct);   // Module 2: ánh sáng + rèm
        den_publish();           // Module 3: trạng thái đèn tầng 1

        // Publish nhiệt độ phòng ngủ
        if (roomTemp != -999.0) {
            mqttClient.publish(
                "smarthome/bedroom/sensors/temperature",
                String(roomTemp, 1).c_str()
            );
            Serial.printf("[DHT22] GUI: smarthome/bedroom/sensors/temperature = %.1f°C\n", roomTemp);
        }
    }

    if (mqtt_isConnected() && now - tHeartbeat >= HEARTBEAT_MS) {
        tHeartbeat = now;
        mqtt_publishHeartbeat();
    }

    mqtt_loop();
    delay(10);
}
