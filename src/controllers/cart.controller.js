const Joi = require("joi");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const addSchema = Joi.object({
  productId: Joi.string().required(),
  size: Joi.string().valid("S", "M", "L").required(),
  qty: Joi.number().integer().min(1).max(99).required()
});

const patchSchema = Joi.object({
  qty: Joi.number().integer().min(1).max(99).optional(),
  size: Joi.string().valid("S", "M", "L").optional()
}).min(1);

async function ensureCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

async function getCart(req, res, next) {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate("items.productId", "name title type category imageUrl isAvailable sizeOptions sizes");
    if (!cart) return res.json({ cart: { items: [] } });
    res.json({ cart });
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { value, error } = addSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    if (!mongoose.isValidObjectId(value.productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const product = await Product.findById(value.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.isAvailable) return res.status(400).json({ message: 'Product is not available' });

    const options = (product.sizeOptions && product.sizeOptions.length) ? product.sizeOptions : product.sizes;
    const sizeOption = (options || []).find((s) => s.size === value.size);
    if (!sizeOption) return res.status(400).json({ message: 'Size is not available for this product' });

    const cart = await ensureCart(req.user.userId);

    const existing = cart.items.find(
      (i) => i.productId.toString() === value.productId && i.size === value.size
    );

    if (existing) {
      existing.qty = Math.min(99, existing.qty + value.qty);
      existing.unitPrice = sizeOption.price;
    } else {
      cart.items.push({
        productId: value.productId,
        size: value.size,
        qty: value.qty,
        unitPrice: sizeOption.price
      });
    }

    await cart.save();

    const updated = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId', 'name title type category imageUrl isAvailable sizeOptions sizes');
    res.status(201).json({ cart: updated });
  } catch (err) {
    next(err);
  }
}

async function patchItem(req, res, next) {
  try {
    const { value, error } = patchSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const cart = await ensureCart(req.user.userId);
    const item = cart.items.id(req.params.id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (value.size) {
      const product = await Product.findById(item.productId);
      const options = (product.sizeOptions && product.sizeOptions.length) ? product.sizeOptions : product.sizes;
      const sizeOption = (options || []).find((s) => s.size === value.size);
      if (!sizeOption) return res.status(400).json({ message: "Size is not available for this product" });

      await Cart.updateOne(
        { userId: req.user.userId, "items._id": item._id },
        { $set: { "items.$.size": value.size, "items.$.unitPrice": sizeOption.price } }
      );
    }

    if (value.qty) {
      await Cart.updateOne(
        { userId: req.user.userId, "items._id": item._id },
        { $set: { "items.$.qty": value.qty } }
      );
    }

    const updated = await Cart.findOne({ userId: req.user.userId })
      .populate("items.productId", "name title type category imageUrl isAvailable sizeOptions sizes");
    res.json({ cart: updated });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const cart = await ensureCart(req.user.userId);
    const item = cart.items.id(req.params.id);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });

    item.remove();
    await cart.save();

    const updated = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId', 'name title type category imageUrl isAvailable sizeOptions sizes');
    res.json({ cart: updated });
  } catch (err) {
    next(err);
  }
}

async function clear(req, res, next) {
  try {
    const cart = await ensureCart(req.user.userId);
    cart.items = [];
    await cart.save();

    const updated = await Cart.findOne({ userId: req.user.userId });
    res.json({ cart: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, patchItem, removeItem, clear };
