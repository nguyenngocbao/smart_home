const mongoose = require("mongoose");

const hubSchema = new mongoose.Schema(
  {
    _id:        { type: String },            // hub_id = "smarthome-hub-001"
    configJson: { type: mongoose.Schema.Types.Mixed, default: {} },
    online:     { type: Boolean, default: false },
    lastSeen:   { type: Date, default: null },
  },
  { timestamps: true, _id: false }
);

hubSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.hubId = ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Hub", hubSchema);
