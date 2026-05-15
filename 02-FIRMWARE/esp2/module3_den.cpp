#include <Arduino.h>
#include <ArduinoJson.h>
#include "module3_den.h"
#include "wifi_mqtt.h"
#include "config.h"

static bool den_light2 = false;

inline void relaySet(int pin, bool on) {
    digitalWrite(pin, on ? LOW : HIGH);   // active LOW
}

// ================================================================
//  KHỞI TẠO MODULE 3
// ================================================================
void den_init() {
    pinMode(PIN_RELAY_LIGHT2, OUTPUT);
    relaySet(PIN_RELAY_LIGHT2, false);   // tắt khi khởi động
    Serial.println("[Module3] Den san thuong: Relay GPIO27 (light2) - tat");
}

// ================================================================
//  ĐIỀU KHIỂN RELAY ĐÈN
// ================================================================
void den_setLight2(bool on) {
    den_light2 = on;
    relaySet(PIN_RELAY_LIGHT2, on);
    Serial.printf("[Module3] Den san thuong (GPIO27): %s\n", on ? "BAT" : "TAT");
}

bool den_getLight2() { return den_light2; }

// ================================================================
//  PUBLISH — smarthome/rooftop/sensors/light2_state
// ================================================================
void den_publish() {
    mqttClient.publish(
        "smarthome/rooftop/sensors/light2_state",
        den_light2 ? "1" : "0"
    );
    Serial.printf("[Module3] GUI: smarthome/rooftop/sensors/light2_state = %s\n",
                  den_light2 ? "1 (BAT)" : "0 (TAT)");
}

// ================================================================
//  NHẬN LỆNH — smarthome/cmd/rooftop/light2
//  Payload: {"state": true}  → bật
//           {"state": false} → tắt
// ================================================================
void den_handleCmd(const String& topic, const char* payload) {
    if (topic != "smarthome/cmd/rooftop/light2") return;

    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, payload) != DeserializationError::Ok) return;

    bool state = doc["state"] | false;
    Serial.printf("[Module3] NHAN lenh den san thuong: %s\n", state ? "BAT" : "TAT");
    den_setLight2(state);
}
