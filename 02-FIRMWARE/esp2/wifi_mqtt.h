#pragma once
#include <WiFi.h>
#include <PubSubClient.h>

// mqttClient dùng chung — các module .cpp include file này để publish
extern PubSubClient mqttClient;

void wifi_connect();
bool mqtt_connect();
void mqtt_loop();
bool mqtt_isConnected();
void mqtt_publishHeartbeat();
