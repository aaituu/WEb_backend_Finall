require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { ensureAdminUser } = require("./utils/adminBootstrap");

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  await ensureAdminUser();
  app.listen(PORT, () => console.log("Server running on port", PORT));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
