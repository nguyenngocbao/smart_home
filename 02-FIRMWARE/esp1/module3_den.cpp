#include <Arduino.h>
#include <ArduinoJson.h>
#include "module3_den.h"
#include "wifi_mqtt.h"   // dùng mqttClient để publish
#include "config.h"

static bool den_light1 = false;
static bool den_light2 = false;

// Relay active HIGH: ON = HIGH, OFF = LOW
inline void relaySet(int pin, bool on) {
    digitalWrite(pin, on ? LOW : HIGH);
}

// ================================================================
//  KHỞI TẠO MODULE 3
// ================================================================
void den_init() {
    pinMode(PIN_RELAY_LIGHT1, OUTPUT);
    pinMode(PIN_RELAY_LIGHT2, OUTPUT);
    relaySet(PIN_RELAY_LIGHT1, false);   // tắt khi khởi động
    relaySet(PIN_RELAY_LIGHT2, false);
    Serial.println("[Module3] Den chieu sang: Relay GPIO26(den1) GPIO27(den2) - tat");
}

// ================================================================
//  ĐIỀU KHIỂN RELAY ĐÈN
// ================================================================
void den_setLight1(bool on) {
    den_light1 = on;
    relaySet(PIN_RELAY_LIGHT1, on);
    Serial.printf("[Module3] Den zone 1 (GPIO26): %s\n", on ? "BAT" : "TAT");
}

void den_setLight2(bool on) {
    den_light2 = on;
    relaySet(PIN_RELAY_LIGHT2, on);
    Serial.printf("[Module3] Den zone 2 (GPIO27): %s\n", on ? "BAT" : "TAT");
}

bool den_getLight1() { return den_light1; }
bool den_getLight2() { return den_light2; }

// ================================================================
//  MODULE 3 — GỬI TRẠNG THÁI ĐÈN LÊN MQTT (PUBLISH)
//
//  Topics:
//    smarthome/bedroom/sensors/light1_state  → "1" (bật) / "0" (tắt)
//    smarthome/bedroom/sensors/light2_state  → "1" (bật) / "0" (tắt)
// ================================================================
void den_publish() {
    mqttClient.publish(
        "smarthome/bedroom/sensors/light1_state",
        den_light1 ? "1" : "0"
    );

    mqttClient.publish(
        "smarthome/bedroom/sensors/light2_state",
        den_light2 ? "1" : "0"
    );

    Serial.println("\n[Module3] DA GUI len MQTT:");
    Serial.printf("  smarthome/bedroom/sensors/light1_state = %s\n", den_light1 ? "BAT (1)" : "TAT (0)");
    Serial.printf("  smarthome/bedroom/sensors/light2_state = %s\n", den_light2 ? "BAT (1)" : "TAT (0)");
}

// ================================================================
//  MODULE 3 — NHẬN LỆNH ĐIỀU KHIỂN TỪ MQTT (SUBSCRIBE)
//
//  Topic 1: smarthome/cmd/bedroom/light1
//  Topic 2: smarthome/cmd/bedroom/light2
//  Payload JSON: { "state": true }   → bật đèn
//                { "state": false }  → tắt đèn
//
//  Hub tự động gửi:
//    18:00 → { "state": true }   (bật đèn theo lịch)
//    06:00 → { "state": false }  (tắt đèn theo lịch)
// ================================================================
void den_handleCmd(const String& topic, const char* payload) {
    // Chỉ xử lý lệnh dành cho đèn
    if (!topic.startsWith("smarthome/cmd/bedroom/light")) return;

    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, payload) != DeserializationError::Ok) return;

    bool state = doc["state"] | false;

    if (topic == "smarthome/cmd/bedroom/light1") {
        Serial.printf("[Module3] NHAN lenh den 1: %s\n", state ? "BAT" : "TAT");
        den_setLight1(state);
    }
    else if (topic == "smarthome/cmd/bedroom/light2") {
        Serial.printf("[Module3] NHAN lenh den 2: %s\n", state ? "BAT" : "TAT");
        den_setLight2(state);
    }
}
