#include <Arduino.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include "module4_cua_troi.h"
#include "wifi_mqtt.h"   // dùng mqttClient để publish
#include "config.h"

static DHT   dht(PIN_DHT22, DHT_TYPE);
static Servo skyServo;
static bool  sky_isOpen = false;   // false = đóng, true = mở

// ================================================================
//  KHỞI TẠO MODULE 4
// ================================================================
void cuaTroi_init() {
    dht.begin();
    // PIN_RAIN là ADC1 input-only — không cần pinMode

    // Cấp phát timer 2 và 3 cho servo — WiFi dùng timer 0 và 1
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    skyServo.setPeriodHertz(50);
    skyServo.attach(PIN_SERVO_SKYLIGHT, 500, 2400);
    skyServo.write(SKYLIGHT_CLOSED_DEG);   // đóng cửa khi khởi động
    sky_isOpen = false;
    Serial.println("[Module4] Cua so troi: DHT22 GPIO4 | Rain GPIO35 | Servo GPIO13 - DONG");
}

// ================================================================
//  ĐỌC CẢM BIẾN NHIỆT ĐỘ (DHT22)
// ================================================================
float cuaTroi_readTemp() {
    float t = dht.readTemperature();
    if (isnan(t)) {
        Serial.println("[Module4] Loi doc DHT22!");
        return -999.0;
    }
    return t;
}

// ================================================================
//  ĐỌC CẢM BIẾN MƯA
// ================================================================
bool cuaTroi_readRain() {
#ifdef SIMULATE_SENSORS
    return false;
#endif
    static int minSeen = 4095;
    static int maxSeen = 0;
    int raw = analogRead(PIN_RAIN);
    if (raw < minSeen) minSeen = raw;
    if (raw > maxSeen) maxSeen = raw;
    bool raining = (raw < RAIN_THRESHOLD);  // ADC giảm khi có nước
    Serial.printf("[DEBUG Rain] GPIO%d raw=%d | min=%d max=%d | threshold=%d | %s\n",
                  PIN_RAIN, raw, minSeen, maxSeen, RAIN_THRESHOLD, raining ? "CO MUA" : "KHONG MUA");
    return raining;
}

// ================================================================
//  ĐIỀU KHIỂN SERVO CỬA SỔ TRỜI
// ================================================================
void cuaTroi_setOpen(bool open) {
    sky_isOpen = open;
    skyServo.write(open ? SKYLIGHT_OPEN_DEG : SKYLIGHT_CLOSED_DEG);
    Serial.printf("[Module4] Cua so troi (GPIO13): %s (servo=%d do)\n",
                  open ? "MO" : "DONG",
                  open ? SKYLIGHT_OPEN_DEG : SKYLIGHT_CLOSED_DEG);
}

bool cuaTroi_isOpen() { return sky_isOpen; }

// ================================================================
//  MODULE 4 — GỬI DỮ LIỆU LÊN MQTT (PUBLISH)
//
//  Topics:
//    smarthome/rooftop/sensors/temperature  → nhiệt độ (°C)
//    smarthome/rooftop/sensors/rain         → "1" (mưa) / "0" (không mưa)
//    smarthome/rooftop/sensors/skylight     → "open" / "closed"
// ================================================================
void cuaTroi_publish(float temp, bool isRaining) {
    // Gửi nhiệt độ lên cloud
    if (temp != -999.0) {
        mqttClient.publish(
            "smarthome/rooftop/sensors/temperature",
            String(temp, 1).c_str()
        );
    }

    // Gửi trạng thái mưa lên cloud
    mqttClient.publish(
        "smarthome/rooftop/sensors/rain",
        isRaining ? "1" : "0"
    );

    // Gửi trạng thái cửa sổ trời lên cloud
    mqttClient.publish(
        "smarthome/rooftop/sensors/skylight",
        sky_isOpen ? "open" : "closed"
    );

    Serial.println("\n[Module4] DA GUI len MQTT:");
    if (temp != -999.0)
        Serial.printf("  smarthome/rooftop/sensors/temperature = %.1f°C\n", temp);
    Serial.printf("  smarthome/rooftop/sensors/rain        = %s\n",
                  isRaining ? "MUA (1)" : "KHONG MUA (0)");
    Serial.printf("  smarthome/rooftop/sensors/skylight    = %s\n",
                  sky_isOpen ? "open" : "closed");
}

// ================================================================
//  MODULE 4 — NHẬN LỆNH ĐIỀU KHIỂN TỪ MQTT (SUBSCRIBE)
//
//  Topic  : smarthome/cmd/rooftop/skylight
//  Payload: { "state": true }   → mở cửa sổ trời thủ công
//           { "state": false }  → đóng cửa sổ trời thủ công
// ================================================================
void cuaTroi_handleCmd(const String& topic, const char* payload) {
    if (topic != "smarthome/cmd/rooftop/skylight") return;

    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, payload) != DeserializationError::Ok) return;

    bool state = doc["state"] | false;
    Serial.printf("[Module4] NHAN lenh cua troi: %s\n", state ? "MO" : "DONG");
    cuaTroi_setOpen(state);
}
