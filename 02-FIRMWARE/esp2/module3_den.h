#pragma once
#include <Arduino.h>

// ================================================================
//  MODULE 3 — ĐÈN SÂN THƯỢNG (Remote Lighting — Rooftop Floor)
//  Actuator: Relay đèn sân thượng → GPIO 27  (active LOW)
//
//  Hub tự động gửi lệnh bật lúc 18:00, tắt lúc 06:00 qua MQTT.
//  Chủ nhà có thể bật/tắt thủ công bất cứ lúc nào qua Dashboard.
//
//  MQTT publish : smarthome/rooftop/sensors/light2_state → "0"/"1"
//  MQTT subscribe: smarthome/cmd/rooftop/light2 → {"state": true/false}
// ================================================================

void den_init();

void den_setLight2(bool on);
bool den_getLight2();

// MQTT
void den_publish();                                              // GỬI trạng thái lên MQTT
void den_handleCmd(const String& topic, const char* payload);   // NHẬN lệnh từ MQTT
