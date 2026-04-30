const { getMqttClient } = require("../config/mqtt");
const hubService     = require("./hubService");
const commandService = require("./commandService");
const rulesService   = require("./rulesService");

function start() {
  const client = getMqttClient();

  client.on("connect", () => {
    // Subscribe tất cả topics từ hub
    const topics = [
      "cloud/+/config",
      "cloud/+/status",
      "cloud/+/+/sensors/+",
      "cloud/+/ack/+",
      "cloud/+/rules_ack",
    ];
    client.subscribe(topics, { qos: 1 }, (err) => {
      if (err) console.error("MQTT subscribe error:", err.message);
      else     console.log("☁️  Subscribed to hub topics");
    });
  });

  client.on("message", async (topic, message) => {
    const payload = message.toString();
    const parts   = topic.split("/");
    // parts[0] = "cloud"

    if (parts.length < 3) return;

    const hubId = parts[1];

    // cloud/{hub_id}/config
    if (parts.length === 3 && parts[2] === "config") {
      await hubService.onConfig(hubId, payload);
      return;
    }

    // cloud/{hub_id}/status
    if (parts.length === 3 && parts[2] === "status") {
      await hubService.onStatus(hubId, payload);
      return;
    }

    // cloud/{hub_id}/rules_ack
    if (parts.length === 3 && parts[2] === "rules_ack") {
      await rulesService.onRulesAck(hubId, payload);
      return;
    }

    // cloud/{hub_id}/ack/{command_id}
    if (parts.length === 4 && parts[2] === "ack") {
      await commandService.onAck(hubId, parts[3], payload);
      return;
    }

    // cloud/{hub_id}/{location_id}/sensors/{sensor_type}
    if (parts.length === 5 && parts[3] === "sensors") {
      await hubService.onSensorData(hubId, parts[2], parts[4], payload);
      return;
    }
  });
}

module.exports = { start };
