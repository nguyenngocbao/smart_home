const router        = require("express").Router();
const SensorHistory = require("../models/SensorHistory");
const env           = require("../config/env");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// GET /api/history?locationId=rooftop&sensorType=temperature&hours=24
router.get("/", async (req, res) => {
  const { locationId, sensorType } = req.query;
  const hours = Math.min(parseInt(req.query.hours || "24"), 168);

  if (!locationId || !sensorType) {
    return res.status(400).json({ error: "locationId and sensorType required" });
  }

  const since = new Date(Date.now() - hours * 3_600_000);

  const records = await SensorHistory.find({
    hubId: env.hubId,
    locationId,
    sensorType,
    recordedAt: { $gte: since },
  })
    .sort({ recordedAt: 1 })
    .select("value unit recordedAt -_id")
    .limit(2000);

  res.json(records);
});

module.exports = router;
