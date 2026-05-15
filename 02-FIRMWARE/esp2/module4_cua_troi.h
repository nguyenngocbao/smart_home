#pragma once
#include <Arduino.h>

// ================================================================
//  MODULE 4 — CỬA SỔ TRỜI CHỐNG MƯA (Skylight Defense)
//  DHT22 đã chuyển xuống esp1 — module này chỉ dùng rain sensor
//
//  Sensor  : Rain sensor → GPIO 35  (phát hiện mưa, ADC1)
//  Actuator: Servo MG995 → GPIO 13  (mở/đóng cửa sổ trời)
//
//  Logic: mưa → đóng cửa | không mưa → giữ nguyên / mở thủ công
// ================================================================

void cuaTroi_init();

bool cuaTroi_readRain();

void cuaTroi_setOpen(bool open);
bool cuaTroi_isOpen();

void cuaTroi_publish(bool isRaining);
void cuaTroi_handleCmd(const String& topic, const char* payload);
