const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/User");
const Cart = require("../models/Cart");
const { signJwt } = require("../utils/jwt");

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  // allow internal domains like admin@coffee.local
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).max(64).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).max(64).required()
});

async function register(req, res, next) {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const exists = await User.findOne({ email: value.email });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(value.password, 10);

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const role = adminEmail && value.email.toLowerCase().trim() === adminEmail ? "admin" : "user";

    const user = await User.create({
      name: value.name,
      email: value.email,
      passwordHash,
      role
    });

    await Cart.create({ userId: user._id, items: [] });

    const token = signJwt(jwt, { userId: user._id.toString(), role: user.role || role || "user" });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role || "user", createdAt: user.createdAt }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const user = await User.findOne({ email: value.email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(value.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signJwt(jwt, { userId: user._id.toString(), role: user.role || "user" });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role || "user", createdAt: user.createdAt }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
