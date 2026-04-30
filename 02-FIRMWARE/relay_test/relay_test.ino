// ================================================================
//  RELAY TEST — kiểm tra relay GPIO26 và GPIO27
//  Nạp sketch này độc lập (không cần WiFi/MQTT)
//  Mở Serial Monitor 115200 baud để theo dõi
//
//  Nếu relay active HIGH: đổi ON=HIGH, OFF=LOW
//  Nếu relay active LOW : giữ nguyên ON=LOW, OFF=HIGH  (mặc định)
// ================================================================

#define PIN_RELAY1  26
#define PIN_RELAY2  27

#define RELAY_ON  HIGH   // active HIGH
#define RELAY_OFF LOW

void setup() {
    Serial.begin(115200);
    delay(500);

    pinMode(PIN_RELAY1, OUTPUT);
    pinMode(PIN_RELAY2, OUTPUT);

    digitalWrite(PIN_RELAY1, RELAY_OFF);
    digitalWrite(PIN_RELAY2, RELAY_OFF);

    Serial.println("=== RELAY TEST BAT DAU ===");
    Serial.println("Relay 1 (GPIO26) va Relay 2 (GPIO27) se bat/tat xen ke");
}

void loop() {
    Serial.println("→ Relay 1 BAT, Relay 2 TAT");
    digitalWrite(PIN_RELAY1, RELAY_ON);
    digitalWrite(PIN_RELAY2, RELAY_OFF);
    delay(2000);

    Serial.println("→ Relay 1 TAT, Relay 2 BAT");
    digitalWrite(PIN_RELAY1, RELAY_OFF);
    digitalWrite(PIN_RELAY2, RELAY_ON);
    delay(2000);

    Serial.println("→ Ca 2 TAT");
    digitalWrite(PIN_RELAY1, RELAY_OFF);
    digitalWrite(PIN_RELAY2, RELAY_OFF);
    delay(1000);
}
