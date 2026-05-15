const { v4: uuidv4 } = require("uuid");
const CommandLog = require("../models/CommandLog");
const socketService = require("./socketService");
const env = require("../config/env");

// pending acks: commandId → { resolve, timeout }
const _pending = new Map();

const ACK_TIMEOUT_MS = 10_000;

function getMqttClient() {
  // Lazy require để tránh circular dependency
  return require("../config/mqtt").getMqttClient();
}

async function sendCommand({ locationId, actuator, state, position = null, userId = null }) {
  const commandId = uuidv4();
  const topic     = `cloud/${env.hubId}/cmd/${locationId}/${actuator}`;
  const payload   = JSON.stringify({
    state,
    ...(position !== null && { position }),
    command_id: commandId,
    issued_by:  userId ?? "system",
    timestamp:  new Date().toISOString(),
  });

  // Log command
  await CommandLog.create({
    _id:        commandId,
    hubId:      env.hubId,
    locationId,
    actuator,
    state:      !!state,
    position,
    issuedBy:   userId,
    issuedAt:   new Date(),
  });

  return new Promise((resolve) => {
    // Timeout nếu hub không ack trong 10s
    const timeout = setTimeout(async () => {
      _pending.delete(commandId);
      await CommandLog.findByIdAndUpdate(commandId, { ackedAt: new Date(), success: false });
      resolve({ commandId, status: "timeout" });
    }, ACK_TIMEOUT_MS);

    _pending.set(commandId, { resolve, timeout });

    getMqttClient().publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        clearTimeout(timeout);
        _pending.delete(commandId);
        resolve({ commandId, status: "publish_error" });
        return;
      }
      // Emit state_update ngay khi publish thành công — không chờ Hub ack
      // Giúp FE cập nhật UI tức thì thay vì đợi round-trip HiveMQ
      socketService.pushStateUpdate(
        locationId,
        actuator,
        position !== null ? position : (state ? 1 : 0),
        "",
        new Date().toISOString()
      );
    });
  });
}

async function onAck(hubId, commandId, payload) {
  try {
    const data    = JSON.parse(payload);
    const success = !!data.success;
    const ackedAt = new Date();

    await CommandLog.findByIdAndUpdate(commandId, { ackedAt, success });

    socketService.pushCommandAck(commandId, success, ackedAt.toISOString());

    const pending = _pending.get(commandId);
    if (pending) {
      clearTimeout(pending.timeout);
      _pending.delete(commandId);
      pending.resolve({ commandId, status: success ? "success" : "failed" });
    }
  } catch (e) {
    console.error("commandService.onAck error:", e.message);
  }
}

module.exports = { sendCommand, onAck };
