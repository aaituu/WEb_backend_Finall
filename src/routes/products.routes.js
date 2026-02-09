const router = require("express").Router();
const { list, getById, create, update, remove } = require("../controllers/products.controller");
const { auth, adminOnly } = require("../middleware/auth.middleware");

router.get("/", list);
router.get("/:id", getById);

router.post("/", auth, adminOnly, create);
router.put("/:id", auth, adminOnly, update);
router.delete("/:id", auth, adminOnly, remove);

module.exports = router;
