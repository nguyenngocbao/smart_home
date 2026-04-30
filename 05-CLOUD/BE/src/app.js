const express = require("express");
const cors    = require("cors");
const env     = require("./config/env");

const app = express();

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use("/auth",         require("./routes/auth"));
app.use("/api/state",    require("./routes/state"));
app.use("/api/control",  require("./routes/control"));
app.use("/api/history",  require("./routes/history"));
app.use("/api/rules",    require("./routes/rules"));
app.use("/api/hub",      require("./routes/hub"));

// Health check
app.get("/health", (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ error: `${req.method} ${req.path} not found` }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
