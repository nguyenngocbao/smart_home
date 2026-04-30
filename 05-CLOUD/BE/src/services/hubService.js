const Hub = require("../models/Hub");
const SensorHistory = require("../models/SensorHistory");
const socketService = require("./socketService");

// In-memory state snapshot: { [locationId]: { sensors: {}, actuators: {} } }
const _stateSnapshot = {};

async function onConfig(hubId, payload) {
  try {
    const data = JSON.parse(payload);
    await Hub.findByIdAndUpdate(
      hubId,
      { configJson: data, lastSeen: new Date() },
      { upsert: true, new: true }
    );
    console.log(`☁️  Hub config updated: ${hubId}`);
  } catch (e) {
    console.error("hubService.onConfig error:", e.message);
  }
}

async function onStatus(hubId, payload) {
  const online   = payload.toString().trim() === "online";
  const lastSeen = new Date();
  try {
    await Hub.findByIdAndUpdate(
      hubId,
      { online, lastSeen },
      { upsert: true, new: true }
    );
    socketService.pushHubStatus(hubId, online, lastSeen.toISOString());
    console.log(`☁️  Hub ${hubId} is ${online ? "ONLINE" : "OFFLINE"}`);
  } catch (e) {
    console.error("hubService.onStatus error:", e.message);
  }
}

async function onSensorData(hubId, locationId, sensorType, payload) {
  try {
    const data      = JSON.parse(payload);
    const value     = data.value;
    const unit      = data.unit ?? "";
    const timestamp = data.timestamp ?? new Date().toISOString();

    // Update in-memory snapshot
    if (!_stateSnapshot[locationId]) _stateSnapshot[locationId] = { sensors: {}, actuators: {} };
    _stateSnapshot[locationId].sensors[sensorType] = { value, unit, timestamp };

    // Update hub lastSeen
    await Hub.findByIdAndUpdate(hubId, { lastSeen: new Date() }, { upsert: true });

    // Persist to history
    await SensorHistory.create({ hubId, locationId, sensorType, value, unit, recordedAt: new Date(timestamp) });

    // Push to FE
    socketService.pushStateUpdate(locationId, sensorType, value, unit, timestamp);
  } catch (e) {
    console.error("hubService.onSensorData error:", e.message);
  }
}

function getStateSnapshot() {
  return _stateSnapshot;
}

function getLocationSnapshot(locationId) {
  return _stateSnapshot[locationId] ?? null;
}

module.exports = { onConfig, onStatus, onSensorData, getStateSnapshot, getLocationSnapshot };
