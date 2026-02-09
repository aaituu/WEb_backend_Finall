const Joi = require("joi");
const Feedback = require("../models/Feedback");

const createSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  subject: Joi.string().min(2).max(120).required(),
  message: Joi.string().min(10).max(2000).required()
});

async function create(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const item = await Feedback.create({
      userId: req.user.userId,
      name: value.name,
      email: value.email,
      subject: value.subject,
      message: value.message
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

async function listMy(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const items = await Feedback.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Feedback.countDocuments({ userId: req.user.userId });
    res.json({ items, page: Number(page), total });
  } catch (err) {
    next(err);
  }
}

async function clearMy(req, res, next) {
  try {
    await Feedback.deleteMany({ userId: req.user.userId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMy, clearMy };
