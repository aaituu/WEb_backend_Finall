const Joi = require("joi");
const nodemailer = require("nodemailer");

const schema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().min(2).max(120).required(),
  message: Joi.string().min(2).max(2000).required()
});

async function sendContact(req, res, next) {
  try {
    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });

    const from = process.env.SMTP_FROM || value.email;
    const to = process.env.SMTP_TO || process.env.SMTP_USER;

    if (!to) return res.status(500).json({ message: "SMTP_TO is not configured" });

    await transporter.sendMail({
      from,
      to,
      replyTo: value.email,
      subject: `[Contact] ${value.subject}`,
      text: `Name: ${value.name}
Email: ${value.email}

${value.message}`
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendContact };
