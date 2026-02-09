const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    // Stored snapshot fields so orders stay consistent even if product changes later.
    // Some older UI parts may still reference `name`, so we keep it as a fallback.
    name: { type: String, default: "" },
    titleSnapshot: { type: String, required: true },
    imageUrlSnapshot: { type: String, default: "" },

    size: { type: String, enum: ["S", "M", "L"], required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["created", "processing", "completed", "cancelled"], default: "created", index: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
