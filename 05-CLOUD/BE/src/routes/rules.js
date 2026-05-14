const router       = require("express").Router();
const rulesService = require("../services/rulesService");
const env          = require("../config/env");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

router.use(authMiddleware);

// GET /api/rules
router.get("/", async (req, res) => {
  const rules = await rulesService.getRules(env.hubId);
  if (!rules) return res.status(404).json({ error: "No rules configured yet" });
  res.json(rules);
});

// PUT /api/rules
router.put("/", requireAdmin, async (req, res) => {
  const allowed = ["wateringSchedule", "wateringSensor", "lightingSchedule", "skylightRules", "blindsAuto"];
  const patch   = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: "No valid fields provided" });
  }

  await rulesService.updateRules(env.hubId, patch);
  res.json({ ok: true, syncStatus: "pending" });
});

module.exports = router;
