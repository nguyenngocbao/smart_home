// ================================================================
//  TEST RELAY — ESP32
//  Blink relay ON/OFF mỗi 2 giây để kiểm tra phần cứng
//
//  Đổi PIN_RELAY theo chip đang test:
//    esp1 đèn 1 → GPIO 26
//    esp1 đèn 2 → GPIO 27
//    esp2 bơm   → GPIO 26
// ================================================================

#define PIN_RELAY   26    // ← đổi pin ở đây
#define RELAY_ON    LOW   // Active LOW (relay module phổ biến)
#define RELAY_OFF   HIGH

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, RELAY_OFF); // tắt relay lúc khởi động

  Serial.println("=== RELAY TEST START ===");
  Serial.printf("Pin: GPIO%d | RELAY_ON=LOW (active low)\n", PIN_RELAY);
}

void loop() {
  // Bật relay
  digitalWrite(PIN_RELAY, RELAY_ON);
  Serial.println(">>> RELAY ON  (nghe tiếng click không?)");
  delay(2000);

  // Tắt relay
  digitalWrite(PIN_RELAY, RELAY_OFF);
  Serial.println(">>> RELAY OFF");
  delay(2000);
}
