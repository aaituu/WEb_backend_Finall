const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/User");
const { signJwt } = require("../utils/jwt");

const schema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(3).max(128).required()
});

async function adminLogin(req, res, next) {
  const { value, error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const user = await User.findOne({ email: value.email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== "admin") return res.status(403).json({ message: "Not an admin" });

    const ok = await bcrypt.compare(value.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signJwt(jwt, { userId: user._id.toString(), role: "admin" });
    res.json({ token, admin: { id: user._id, email: user.email, role: "admin" } });
  } catch (err) {
    next(err);
  }
}

module.exports = { adminLogin };
