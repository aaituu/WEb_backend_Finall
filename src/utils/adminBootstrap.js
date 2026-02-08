const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Ensures there is an admin user in the DB.
// Uses ADMIN_EMAIL / ADMIN_PASSWORD from .env
async function ensureAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    // If user exists but not admin, promote
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
    }
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: "Admin",
    email: adminEmail,
    passwordHash,
    role: "admin"
  });
}

module.exports = { ensureAdminUser };
