const Joi = require("joi");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createSchema = Joi.object({
  customerName: Joi.string().allow("").max(80).optional(),
  phone: Joi.string().allow("").max(30).optional(),
  address: Joi.string().allow("").max(120).optional(),
  note: Joi.string().allow("").max(300).optional()
}).optional();

const statusSchema = Joi.object({
  status: Joi.string().valid("created", "processing", "completed", "cancelled").required()
});

async function createOrder(req, res, next) {
  try {
    createSchema.validate(req.body || {});
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

    // lock product names in order, recalc prices
    const items = [];
    let subtotal = 0;

    for (const ci of cart.items) {
      const product = await Product.findById(ci.productId);
      if (!product) continue;

      // Products may be inserted directly in MongoDB (Compass/mongosh) using
      // either name/type/sizeOptions or title/category/sizes. Handle both.
      const productName = product.name || product.title || ci.titleSnapshot || ci.name || "";
      const productImage = product.imageUrl || ci.imageUrlSnapshot || "";

      const opts = (product.sizeOptions && product.sizeOptions.length)
        ? product.sizeOptions
        : (product.sizes || []);
      const sizeOption = (opts || []).find((s) => s.size === ci.size);
      const unitPrice = sizeOption ? sizeOption.price : ci.unitPrice;
      const lineTotal = unitPrice * ci.qty;

      items.push({
        productId: product._id,
        // keep both fields
        name: productName,
        titleSnapshot: productName,
        imageUrlSnapshot: productImage,
        size: ci.size,
        qty: ci.qty,
        unitPrice,
        lineTotal
      });

      subtotal += lineTotal;
    }

    // If we couldn't build any valid items (e.g., products deleted), block checkout.
    if (items.length === 0) return res.status(400).json({ message: "Cart items are not valid" });

    const total = subtotal;

    const order = await Order.create({
      userId: req.user.userId,
      items,
      subtotal,
      total,
      status: "created",
      meta: req.body || {}
    });

    await Cart.updateOne({ userId: req.user.userId }, { $set: { items: [] } });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getMyOrder(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

async function adminList(req, res, next) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function adminUpdateStatus(req, res, next) {
  try {
    const { value, error } = statusSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status: value.status } },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrder,
  adminList,
  adminUpdateStatus
};
