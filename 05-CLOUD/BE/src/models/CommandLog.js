const mongoose = require("mongoose");

const commandLogSchema = new mongoose.Schema({
  _id:        { type: String },            // command_id UUID
  hubId:      { type: String, required: true },
  locationId: { type: String, required: true },
  actuator:   { type: String, required: true },
  state:      { type: Boolean, required: true },
  position:   { type: Number, default: null },   // curtain only
  issuedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  issuedAt:   { type: Date, default: Date.now },
  ackedAt:    { type: Date, default: null },
  success:    { type: Boolean, default: null },   // null = pending
}, { _id: false });

// TTL: tự xóa sau 90 ngày
commandLogSchema.index({ issuedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model("CommandLog", commandLogSchema);
