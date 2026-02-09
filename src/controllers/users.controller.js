const Joi = require("joi");
const User = require("../models/User");

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional(),
  email: Joi.string().email().optional()
});

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select("name email createdAt updatedAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    if (value.email) {
      const exists = await User.findOne({ email: value.email, _id: { $ne: req.user.userId } });
      if (exists) return res.status(409).json({ message: "Email already in use" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: value },
      { new: true, runValidators: true }
    ).select("name email createdAt updatedAt");

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { me, updateMe };
