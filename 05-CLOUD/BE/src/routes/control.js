const router         = require("express").Router();
const CommandLog     = require("../models/CommandLog");
const commandService = require("../services/commandService");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

router.use(authMiddleware);

// POST /api/control/:locationId/:actuator
router.post("/:locationId/:actuator", requireAdmin, async (req, res) => {
  const { locationId, actuator } = req.params;
  const { state, position }      = req.body ?? {};

  if (state === undefined) return res.status(400).json({ error: "state required" });

  const result = await commandService.sendCommand({
    locationId,
    actuator,
    state: !!state,
    position: position ?? null,
    userId: req.user?.id ?? null,
  });

  if (result.status === "timeout") {
    return res.status(504).json(result);
  }
  res.json(result);
});

// GET /api/control/:commandId
router.get("/:commandId", async (req, res) => {
  const log = await CommandLog.findById(req.params.commandId);
  if (!log) return res.status(404).json({ error: "Command not found" });

  const status = log.success === null ? "pending" : log.success ? "success" : "failed";
  res.json({
    commandId: log._id,
    status,
    issuedAt:  log.issuedAt,
    ackedAt:   log.ackedAt,
    success:   log.success,
  });
});

module.exports = router;
