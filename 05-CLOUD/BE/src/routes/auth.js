const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const User    = require("../models/User");
const env     = require("../config/env");

function signAccess(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { id: user._id },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);

  user.refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await user.save();

  res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role } });
});

// POST /auth/refresh
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const user = await User.findById(payload.id);
  if (!user || user.refreshTokenHash !== hash) {
    return res.status(401).json({ error: "Refresh token revoked" });
  }

  res.json({ accessToken: signAccess(user) });
});

// POST /auth/logout
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (refreshToken) {
    const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await User.findOneAndUpdate({ refreshTokenHash: hash }, { refreshTokenHash: null });
  }
  res.json({ ok: true });
});

module.exports = router;
