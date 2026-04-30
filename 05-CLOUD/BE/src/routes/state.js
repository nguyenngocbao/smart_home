const router     = require("express").Router();
const Hub        = require("../models/Hub");
const hubService = require("../services/hubService");
const env        = require("../config/env");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// GET /api/state
router.get("/", async (req, res) => {
  const hub       = await Hub.findById(env.hubId);
  const locations = hubService.getStateSnapshot();
  res.json({
    hubOnline: hub?.online ?? false,
    lastSeen:  hub?.lastSeen ?? null,
    locations,
  });
});

// GET /api/state/:locationId
router.get("/:locationId", async (req, res) => {
  const data = hubService.getLocationSnapshot(req.params.locationId);
  if (!data) return res.status(404).json({ error: "Location not found" });
  res.json(data);
});

module.exports = router;
