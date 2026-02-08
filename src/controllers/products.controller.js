const Joi = require("joi");
const Product = require("../models/Product");

function normalizeProduct(doc) {
  const p = doc && typeof doc.toObject === "function" ? doc.toObject() : { ...(doc || {}) };
  // Support both schemas: {name,type,sizeOptions} and {title,category,sizes}
  if (!p.name && p.title) p.name = p.title;
  if (!p.type && p.category) p.type = p.category;
  if ((!p.sizeOptions || !p.sizeOptions.length) && Array.isArray(p.sizes)) p.sizeOptions = p.sizes;
  return p;
}

const sizesSchema = Joi.array()
  .items(
    Joi.object({
      size: Joi.string().valid("S", "M", "L").required(),
      price: Joi.number().min(0).required()
    })
  )
  .min(1);

const createSchema = Joi.object({
  // accept either name or title
  name: Joi.string().min(2).max(120).optional(),
  title: Joi.string().min(2).max(120).optional(),

  // accept either type or category
  type: Joi.string().min(2).max(80).optional(),
  category: Joi.string().min(2).max(80).optional(),

  description: Joi.string().allow("").max(800).optional(),
  ingredients: Joi.array().items(Joi.string().max(60)).optional(),

  // accept either sizeOptions or sizes
  sizeOptions: sizesSchema.optional(),
  sizes: sizesSchema.optional(),

  imageUrl: Joi.string().allow("").optional(),
  isAvailable: Joi.boolean().optional()
}).custom((value, helpers) => {
  const hasName = !!(value.name || value.title);
  const hasType = !!(value.type || value.category);
  const so = value.sizeOptions || value.sizes;
  const hasSizes = Array.isArray(so) && so.length > 0;

  if (!hasName) return helpers.error("any.custom", { message: "name/title is required" });
  if (!hasType) return helpers.error("any.custom", { message: "type/category is required" });
  if (!hasSizes) return helpers.error("any.custom", { message: "sizeOptions/sizes is required" });
  return value;
}, "schema variants");

const updateSchema = createSchema.fork(["name", "title", "type", "category", "sizeOptions", "sizes"], (s) => s.optional());

async function list(req, res, next) {
  try {
    const { q, type, category, available, page = 1, limit = 50 } = req.query;

    const filter = {};
    const typeLike = type || category;
    if (typeLike) {
      filter.$or = [{ type: typeLike }, { category: typeLike }];
    }
    if (available === "true") filter.isAvailable = true;
    if (available === "false") filter.isAvailable = false;

    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);
    const itemsRaw = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    const items = (itemsRaw || []).map(normalizeProduct);
    res.json({ items, page: Number(page), total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const itemRaw = await Product.findById(req.params.id).lean();
    const item = itemRaw ? normalizeProduct(itemRaw) : null;
    if (!item) return res.status(404).json({ message: "Product not found" });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const itemCreated = await Product.create(value);
    const item = normalizeProduct(itemCreated);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const item = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: "Product not found" });

    res.json({ item: normalizeProduct(item) });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const item = await Product.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
