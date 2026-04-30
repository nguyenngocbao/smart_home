#pragma once
#include <Arduino.h>

// ================================================================
//  MODULE 4 — CỬA SỔ TRỜI CHỐNG NÓNG & MƯA (Skylight Defense)
//  Sensor  : DHT22       → GPIO 4   (nhiệt độ không khí)
//  Sensor  : Rain sensor → GPIO 35  (phát hiện mưa, ADC1)
//  Actuator: Servo MG995 → GPIO 13  (mở/đóng cửa sổ trời)
// ================================================================

void cuaTroi_init();

// Đọc cảm biến
float cuaTroi_readTemp();    // trả về °C  (-999.0 nếu DHT22 lỗi)
bool  cuaTroi_readRain();    // true = đang mưa

// Điều khiển servo cửa trời
void cuaTroi_setOpen(bool open);   // true = mở, false = đóng
bool cuaTroi_isOpen();

// MQTT
void cuaTroi_publish(float temp, bool isRaining);                       // GỬI dữ liệu lên MQTT
void cuaTroi_handleCmd(const String& topic, const char* payload);       // NHẬN lệnh từ MQTT
