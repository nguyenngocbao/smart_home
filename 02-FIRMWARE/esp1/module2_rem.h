#pragma once
#include <Arduino.h>

// ================================================================
//  MODULE 2 — RÈM CỬA THÔNG MINH (Smart Shading Control)
//  Sensor  : LDR       → GPIO 34  (đo độ chói ánh sáng)
//  Actuator: Servo     → GPIO 13  (kéo rèm 0–100%)
// ================================================================

void rem_init();

// Đọc cảm biến
int  rem_readLight();        // trả về % ánh sáng (0=tối, 100=sáng)

// Điều khiển servo
void rem_setPosition(int pct);  // 0 = đóng hoàn toàn, 100 = mở hoàn toàn
int  rem_getPosition();         // vị trí rèm hiện tại (%)

// MQTT
void rem_publish(int lightPct);                         // GỬI dữ liệu lên MQTT
void rem_handleCmd(const String& topic, const char* payload);  // NHẬN lệnh từ MQTT
