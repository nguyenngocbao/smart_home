const mongoose = require("mongoose");

const sensorHistorySchema = new mongoose.Schema({
  hubId:      { type: String, required: true },
  locationId: { type: String, required: true },
  sensorType: { type: String, required: true },
  value:      { type: Number, required: true },
  unit:       { type: String, default: "" },
  recordedAt: { type: Date, default: Date.now },
});

// Compound index cho queries lịch sử
sensorHistorySchema.index({ hubId: 1, locationId: 1, sensorType: 1, recordedAt: -1 });

// TTL: tự xóa sau 30 ngày
sensorHistorySchema.index({ recordedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("SensorHistory", sensorHistorySchema);
