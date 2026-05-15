#include <Arduino.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include "module4_cua_troi.h"
#include "wifi_mqtt.h"
#include "config.h"

static Servo skyServo;
static bool  sky_isOpen = false;

// ================================================================
void cuaTroi_init() {
    // PIN_RAIN là ADC1 input-only — không cần pinMode
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    skyServo.setPeriodHertz(50);
    skyServo.attach(PIN_SERVO_SKYLIGHT, 500, 2400);
    skyServo.write(SKYLIGHT_CLOSED_DEG);
    sky_isOpen = false;
    Serial.println("[Module4] Cua so troi: Rain GPIO35 | Servo GPIO13 - DONG");
    Serial.println("[Module4] DHT22 da chuyen sang esp1 (bedroom)");
}

// ================================================================
bool cuaTroi_readRain() {
    static int minSeen = 4095;
    static int maxSeen = 0;
    int raw = analogRead(PIN_RAIN);
    if (raw < minSeen) minSeen = raw;
    if (raw > maxSeen) maxSeen = raw;
    bool raining = (raw < RAIN_THRESHOLD);
    Serial.printf("[DEBUG Rain] GPIO%d raw=%d | min=%d max=%d | threshold=%d | %s\n",
                  PIN_RAIN, raw, minSeen, maxSeen, RAIN_THRESHOLD, raining ? "CO MUA" : "KHONG MUA");
    return raining;
}

// ================================================================
void cuaTroi_setOpen(bool open) {
    sky_isOpen = open;
    skyServo.write(open ? SKYLIGHT_OPEN_DEG : SKYLIGHT_CLOSED_DEG);
    Serial.printf("[Module4] Cua so troi: %s (servo=%d do)\n",
                  open ? "MO" : "DONG",
                  open ? SKYLIGHT_OPEN_DEG : SKYLIGHT_CLOSED_DEG);
}

bool cuaTroi_isOpen() { return sky_isOpen; }

// ================================================================
//  PUBLISH — rain + skylight state
//  (temperature không còn publish ở đây — esp1 lo)
// ================================================================
void cuaTroi_publish(bool isRaining) {
    mqttClient.publish(
        "smarthome/rooftop/sensors/rain",
        isRaining ? "1" : "0"
    );
    mqttClient.publish(
        "smarthome/rooftop/sensors/skylight",
        sky_isOpen ? "open" : "closed"
    );
    Serial.printf("[Module4] DA GUI: rain=%s  skylight=%s\n",
                  isRaining ? "MUA (1)" : "KHONG (0)",
                  sky_isOpen ? "open" : "closed");
}

// ================================================================
void cuaTroi_handleCmd(const String& topic, const char* payload) {
    if (topic != "smarthome/cmd/rooftop/skylight") return;

    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, payload) != DeserializationError::Ok) return;

    bool state = doc["state"] | false;
    Serial.printf("[Module4] NHAN lenh cua troi: %s\n", state ? "MO" : "DONG");
    cuaTroi_setOpen(state);
}
