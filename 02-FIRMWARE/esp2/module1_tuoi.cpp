#include <Arduino.h>
#include <ArduinoJson.h>
#include "module1_tuoi.h"
#include "wifi_mqtt.h"   // dùng mqttClient để publish
#include "config.h"

static bool tuoi_pump = false;

// Relay active LOW: ON = LOW, OFF = HIGH
inline void pumpSet(bool on) {
    digitalWrite(PIN_RELAY_PUMP, on ? LOW : HIGH);
}

// ================================================================
//  KHỞI TẠO MODULE 1
// ================================================================
void tuoi_init() {
    pinMode(PIN_RELAY_PUMP, OUTPUT);
    pumpSet(false);   // tắt bơm khi khởi động
    tuoi_pump = false;
    Serial.println("[Module1] Tuoi tu dong: Relay GPIO26 - tat bom");
}

// ================================================================
//  ĐỌC CẢM BIẾN ĐỘ ẨM ĐẤT
// ================================================================
int tuoi_readSoil() {
#ifdef SIMULATE_SENSORS
    return 45;
#endif
    int raw = analogRead(PIN_SOIL);
    int pct = map(raw, SOIL_DRY_ADC, SOIL_WET_ADC, 0, 100);
    int result = constrain(pct, 0, 100);
    Serial.printf("[DEBUG Soil] GPIO%d raw ADC=%d | SOIL_DRY=%d SOIL_WET=%d | ket qua=%d%%\n",
                  PIN_SOIL, raw, SOIL_DRY_ADC, SOIL_WET_ADC, result);
    return result;
}

// ================================================================
//  ĐIỀU KHIỂN BƠM NƯỚC
// ================================================================
void tuoi_setPump(bool on) {
    tuoi_pump = on;
    pumpSet(on);
    Serial.printf("[Module1] Bom nuoc (GPIO26): %s\n", on ? "BAT" : "TAT");
}

bool tuoi_getPump() { return tuoi_pump; }

// ================================================================
//  MODULE 1 — GỬI DỮ LIỆU LÊN MQTT (PUBLISH)
//
//  Topics:
//    smarthome/rooftop/sensors/soil_moisture  → độ ẩm đất (%)
//    smarthome/rooftop/sensors/pump_state     → "1" (đang bơm) / "0" (tắt)
// ================================================================
void tuoi_publish(int soilPct) {
    // Gửi độ ẩm đất lên cloud (chủ nhà xem lịch sử chăm sóc vườn)
    mqttClient.publish(
        "smarthome/rooftop/sensors/soil_moisture",
        String(soilPct).c_str()
    );

    // Gửi trạng thái bơm lên cloud
    mqttClient.publish(
        "smarthome/rooftop/sensors/pump_state",
        tuoi_pump ? "1" : "0"
    );

    Serial.println("\n[Module1] DA GUI len MQTT:");
    Serial.printf("  smarthome/rooftop/sensors/soil_moisture = %d%%\n", soilPct);
    Serial.printf("  smarthome/rooftop/sensors/pump_state    = %s\n",
                  tuoi_pump ? "BAT (1)" : "TAT (0)");
}

// ================================================================
//  MODULE 1 — NHẬN LỆNH ĐIỀU KHIỂN TỪ MQTT (SUBSCRIBE)
//
//  Topic  : smarthome/cmd/rooftop/pump
//  Payload: { "state": true }   → bật bơm thủ công
//           { "state": false }  → tắt bơm thủ công
// ================================================================
void tuoi_handleCmd(const String& topic, const char* payload) {
    if (topic != "smarthome/cmd/rooftop/pump") return;

    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, payload) != DeserializationError::Ok) return;

    bool state = doc["state"] | false;
    Serial.printf("[Module1] NHAN lenh bom: %s\n", state ? "BAT" : "TAT");
    tuoi_setPump(state);
}
