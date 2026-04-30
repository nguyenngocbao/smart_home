#include <Arduino.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include "module2_rem.h"
#include "wifi_mqtt.h"
#include "config.h"

static Servo rem_servo;
static int   rem_pos = 0;   // vị trí rèm hiện tại: 0–100%

void rem_init() {
    ESP32PWM::allocateTimer(2);   // WiFi dùng timer 0+1, servo dùng timer 2
    rem_servo.setPeriodHertz(50);
    rem_servo.attach(PIN_SERVO_CURTAIN, 500, 2400);
    rem_servo.write(CURTAIN_SERVO_CLOSE_DEG);
    delay(600);
    rem_servo.detach();   // detach sau khi đến vị trí, tránh jitter
    rem_pos = 0;
    Serial.println("[Module2] Rem cua: Servo GPIO13 - khoi dong vi tri DONG (0%)");
}

int rem_readLight() {
    int raw = analogRead(PIN_LDR);
    int pct = map(raw, LDR_DARK_ADC, LDR_BRIGHT_ADC, 0, 100);
    return constrain(pct, 0, 100);
}

void rem_setPosition(int pct) {
    pct = constrain(pct, 0, 100);
    if (pct == rem_pos) return;   // không đổi thì không ghi, tránh jitter

    int angle = map(pct, 0, 100, CURTAIN_SERVO_CLOSE_DEG, CURTAIN_SERVO_OPEN_DEG);
    rem_servo.attach(PIN_SERVO_CURTAIN);
    rem_servo.write(angle);
    delay(600);           // chờ SG90 đến vị trí
    rem_servo.detach();   // detach → servo đứng yên, không rung

    rem_pos = pct;
    Serial.printf("[Module2] Servo rem: %d%% (goc=%d do)\n", pct, angle);
}

int rem_getPosition() { return rem_pos; }

void rem_publish(int lightPct) {
    mqttClient.publish("smarthome/bedroom/sensors/light",   String(lightPct).c_str());
    mqttClient.publish("smarthome/bedroom/sensors/curtain", String(rem_pos).c_str());
    Serial.printf("[Module2] MQTT: light=%d%% curtain=%d%%\n", lightPct, rem_pos);
}

// Nhận lệnh: {"position": 70}
void rem_handleCmd(const String& topic, const char* payload) {
    if (topic != "smarthome/cmd/bedroom/curtain") return;

    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, payload) != DeserializationError::Ok) return;
    if (!doc.containsKey("position")) return;

    int newPos = doc["position"] | rem_pos;
    Serial.printf("[Module2] NHAN lenh: position=%d%%\n", newPos);
    rem_setPosition(newPos);
}
