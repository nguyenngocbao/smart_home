#pragma once
#include <Arduino.h>

// ================================================================
//  MODULE 1 — TƯỚI BAN CÔNG TỰ ĐỘNG (Smart Irrigation)
//  Sensor  : Soil moisture capacitive → GPIO 34 (ADC1)
//  Actuator: Relay bơm nước           → GPIO 26  (active LOW)
// ================================================================

void tuoi_init();

// Đọc cảm biến độ ẩm đất
int  tuoi_readSoil();        // trả về % độ ẩm (0=khô, 100=ướt)

// Điều khiển bơm
void tuoi_setPump(bool on);
bool tuoi_getPump();

// MQTT
void tuoi_publish(int soilPct);                                  // GỬI dữ liệu lên MQTT
void tuoi_handleCmd(const String& topic, const char* payload);   // NHẬN lệnh từ MQTT
