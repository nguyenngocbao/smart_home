// ================================================================
//  SERVO TEST — kiểm tra servo SG90 trên GPIO13
//  Nạp sketch này độc lập (không cần WiFi/MQTT)
//  Mở Serial Monitor 115200 baud để theo dõi
// ================================================================

#include <ESP32Servo.h>

Servo s;

void setup() {
    Serial.begin(115200);
    delay(500);

    ESP32PWM::allocateTimer(2);
    s.setPeriodHertz(50);
    s.attach(26, 500, 2400);   // GPIO13

    Serial.println("=== SERVO TEST BAT DAU ===");
    Serial.println("Servo se quay: 0 → 90 → 180 → 0 (lap lai)");
}

void loop() {
    Serial.println("→ 0 do (DONG)");
    s.write(0);
    delay(5000);

    Serial.println("→ 90 do (GIUA)");
    s.write(90);
    delay(5000);

    Serial.println("→ 180 do (MO)");
    s.write(180);
    delay(5000);
}
