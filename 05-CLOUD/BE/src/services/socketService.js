const { getIO } = require("../socket");

function pushStateUpdate(locationId, sensorType, value, unit, timestamp) {
  getIO().to("hub-room").emit("state_update", { locationId, sensorType, value, unit, timestamp });
}

function pushHubStatus(hubId, online, lastSeen) {
  getIO().to("hub-room").emit("hub_status", { hubId, online, lastSeen });
}

function pushCommandAck(commandId, success, ackedAt) {
  getIO().to("hub-room").emit("command_ack", { commandId, success, ackedAt });
}

function pushRulesSynced(syncedAt) {
  getIO().to("hub-room").emit("rules_synced", { syncedAt });
}

module.exports = { pushStateUpdate, pushHubStatus, pushCommandAck, pushRulesSynced };
