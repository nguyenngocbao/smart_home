const mqttLib = require("mqtt");
const env = require("./env");

let _client = null;

function getMqttClient() {
  if (_client) return _client;

  _client = mqttLib.connect(env.mqtt.brokerUrl, {
    clientId:  env.mqtt.clientId,
    username:  env.mqtt.username,
    password:  env.mqtt.password,
    clean:     true,
    reconnectPeriod: 5000,
    // mqtt.js tự xử lý TLS khi URL bắt đầu bằng mqtts://
  });

  _client.on("connect",    () => console.log("☁️  Cloud MQTT connected"));
  _client.on("reconnect",  () => console.log("☁️  Cloud MQTT reconnecting..."));
  _client.on("error",      (e) => console.error("☁️  Cloud MQTT error:", e.message));
  _client.on("offline",    () => console.warn("☁️  Cloud MQTT offline"));

  return _client;
}

module.exports = { getMqttClient };
