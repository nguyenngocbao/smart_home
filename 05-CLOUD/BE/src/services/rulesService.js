const Rules = require("../models/Rules");
const socketService = require("./socketService");
const env = require("../config/env");

function getMqttClient() {
  return require("../config/mqtt").getMqttClient();
}

async function getRules(hubId) {
  const doc = await Rules.findById(hubId);
  return doc ?? null;
}

async function updateRules(hubId, patch) {
  const now = new Date();
  const doc = await Rules.findByIdAndUpdate(
    hubId,
    { $set: { ...patch, updatedAt: now, syncedAt: null } },
    { upsert: true, new: true, runValidators: true }
  );

  // Publish xuống hub (retain=true — hub nhận ngay cả khi đang offline)
  const payload = {
    wateringSchedule: doc.wateringSchedule,
    wateringSensor:   doc.wateringSensor,
    lightingSchedule: doc.lightingSchedule,
    skylightRules:    doc.skylightRules,
    blindsAuto:       doc.blindsAuto,
    updatedAt:        now.toISOString(),
  };
  getMqttClient().publish(
    `cloud/${hubId}/rules`,
    JSON.stringify(payload),
    { qos: 1, retain: true }
  );

  return doc;
}

async function onRulesAck(hubId, payload) {
  try {
    const data     = JSON.parse(payload);
    const syncedAt = new Date();
    await Rules.findByIdAndUpdate(hubId, { syncedAt });
    socketService.pushRulesSynced(syncedAt.toISOString());
    console.log(`☁️  Rules synced to hub ${hubId}`);
  } catch (e) {
    console.error("rulesService.onRulesAck error:", e.message);
  }
}

module.exports = { getRules, updateRules, onRulesAck };
