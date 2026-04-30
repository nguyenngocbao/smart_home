#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "wifi_mqtt.h"
#include "config.h"
#include "module1_tuoi.h"       // để gọi tuoi_handleCmd()
#include "module4_cua_troi.h"   // để gọi cuaTroi_handleCmd()

// ── MQTT client dùng chung toàn project ──────────────────────────
#ifdef MQTT_TLS
static WiFiClientSecure espClient;
#else
static WiFiClient espClient;
#endif
PubSubClient mqttClient(espClient);

// ================================================================
//  MQTT CALLBACK — Nhận lệnh từ Hub, phân phối đến từng module
// ================================================================
static void onMQTTMessage(char* topicRaw, byte* payload, unsigned int len) {
    char buf[256];
    unsigned int copyLen = (len < 255) ? len : 255;
    memcpy(buf, payload, copyLen);
    buf[copyLen] = '\0';

    String topic = String(topicRaw);
    Serial.println("\n========================================");
    Serial.println("[MQTT] Nhan lenh tu Hub:");
    Serial.print("  Topic  : "); Serial.println(topic);
    Serial.print("  Payload: "); Serial.println(buf);
    Serial.println("========================================");

    // Phân phối lệnh đến đúng module
    tuoi_handleCmd(topic, buf);       // Module 1 — Tưới tự động
    cuaTroi_handleCmd(topic, buf);    // Module 4 — Cửa sổ trời
}

// ── WiFi ─────────────────────────────────────────────────────────
void wifi_connect() {
    Serial.printf("\n[WiFi] Dang ket noi toi: %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    unsigned long t0 = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t0 < WIFI_TIMEOUT_MS) {
        delay(500);
        yield();   // feed watchdog trong lúc chờ WiFi
        Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] OK — IP: %s\n", WiFi.localIP().toString().c_str());
        digitalWrite(PIN_LED_STATUS, HIGH);
    } else {
        Serial.println("\n[WiFi] Timeout! Dang khoi dong lai...");
        delay(2000);
        ESP.restart();
    }
}

// ── MQTT Connect ─────────────────────────────────────────────────
bool mqtt_connect() {
    if (mqttClient.connected()) return true;

#ifdef MQTT_TLS
    espClient.setInsecure();   // bỏ qua verify cert — đủ dùng cho HiveMQ free tier
#endif

    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(onMQTTMessage);
    mqttClient.setBufferSize(512);

    Serial.printf("[MQTT] Dang ket noi toi broker: %s ...\n", MQTT_BROKER);

    // Last Will: Hub biết chip offline nếu mất kết nối đột ngột
    const char* will = "{\"status\":\"offline\",\"device\":\"" DEVICE_NAME "\"}";
    bool ok = mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD,
                                 TOPIC_STATUS, 1, true, will);
    if (ok) {
        // Subscribe nhận mọi lệnh dành cho rooftop
        mqttClient.subscribe("smarthome/cmd/rooftop/#");

        const char* online = "{\"status\":\"online\",\"device\":\"" DEVICE_NAME "\","
                             "\"version\":\"" FIRMWARE_VERSION "\"}";
        mqttClient.publish(TOPIC_STATUS, online, true);

        Serial.println("[MQTT] Ket noi thanh cong!");
        Serial.println("[MQTT] Da subscribe: smarthome/cmd/rooftop/#");
    } else {
        Serial.printf("[MQTT] That bai! rc = %d\n", mqttClient.state());
    }
    return ok;
}

void mqtt_loop()        { mqttClient.loop(); }
bool mqtt_isConnected() { return mqttClient.connected(); }

// ── Heartbeat ─────────────────────────────────────────────────────
void mqtt_publishHeartbeat() {
    StaticJsonDocument<128> doc;
    doc["device"] = DEVICE_NAME;
    doc["uptime"] = millis() / 1000;
    doc["heap"]   = ESP.getFreeHeap();
    doc["rssi"]   = WiFi.RSSI();
    char buf[128];
    serializeJson(doc, buf);
    mqttClient.publish(TOPIC_HEARTBEAT, buf);
    Serial.printf("[MQTT] Heartbeat gui: %s\n", buf);
}
