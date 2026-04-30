const mongoose = require("mongoose");

const rulesSchema = new mongoose.Schema(
  {
    _id:    { type: String },             // hub_id

    wateringSchedule: { type: [String], default: ["06:00", "17:00"] },

    wateringSensor: {
      enabled:      { type: Boolean, default: true },
      dryThreshold: { type: Number,  default: 30 },
      wetThreshold: { type: Number,  default: 70 },
      stopOnRain:   { type: Boolean, default: true },
    },

    lightingSchedule: {
      enabled: { type: Boolean, default: true },
      onTime:  { type: String,  default: "18:00" },
      offTime: { type: String,  default: "06:00" },
      lights:  { type: [String], default: ["light1", "light2"] },
    },

    skylightRules: {
      enabled:      { type: Boolean, default: true },
      autoOpenTemp: { type: Number,  default: 35 },
      closeOnRain:  { type: Boolean, default: true },
    },

    blindsAuto: {
      enabled:        { type: Boolean, default: false },
      closeThreshold: { type: Number,  default: 80 },
      openThreshold:  { type: Number,  default: 20 },
    },

    updatedAt: { type: Date, default: null },
    syncedAt:  { type: Date, default: null },
  },
  { _id: false }
);

module.exports = mongoose.model("Rules", rulesSchema);
