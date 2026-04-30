#pragma once
#include <Arduino.h>

// ================================================================
//  MODULE 3 — ĐÈN CHIẾU SÁNG TỪ XA (Remote Lighting)
//  Actuator: Relay đèn 1 → GPIO 26  (active LOW)
//  Actuator: Relay đèn 2 → GPIO 27  (active LOW)
//
//  Hub tự động gửi lệnh bật lúc 18:00, tắt lúc 06:00 qua MQTT.
//  Chủ nhà có thể bật/tắt thủ công bất cứ lúc nào qua Dashboard.
// ================================================================

void den_init();

void den_setLight1(bool on);
void den_setLight2(bool on);
bool den_getLight1();
bool den_getLight2();

// MQTT
void den_publish();                                              // GỬI trạng thái lên MQTT
void den_handleCmd(const String& topic, const char* payload);   // NHẬN lệnh từ MQTT
