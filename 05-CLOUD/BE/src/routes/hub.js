const router = require("express").Router();
const Hub    = require("../models/Hub");
const env    = require("../config/env");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// GET /api/hub/status
router.get("/status", async (req, res) => {
  const hub = await Hub.findById(env.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not registered yet" });
  res.json({ hubId: hub._id, online: hub.online, lastSeen: hub.lastSeen });
});

// GET /api/hub/devices  — trả configJson (device layout) cho FE render dynamic
router.get("/devices", async (req, res) => {
  const hub = await Hub.findById(env.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not registered yet" });
  res.json(hub.configJson ?? {});
});

module.exports = router;
