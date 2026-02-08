const mongoose = require("mongoose");

const sizeOptionSchema = new mongoose.Schema(
  {
    size: { type: String, enum: ["S", "M", "L"], required: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // Main fields used by the frontend
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, required: true, trim: true, maxlength: 80, index: true },

    // Compatibility aliases (some inserts may use these)
    title: { type: String, trim: true, maxlength: 120 },
    category: { type: String, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 800 },
    ingredients: { type: [String], default: [] },
    sizeOptions: { type: [sizeOptionSchema], default: [] },
    sizes: { type: [sizeOptionSchema], default: [] },
    imageUrl: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

// Normalize alias fields into the main fields so the app works even if
// products were inserted using title/category/sizes.
productSchema.pre("validate", function (next) {
  if (!this.name && this.title) this.name = this.title;
  if (!this.type && this.category) this.type = this.category;
  if ((!this.sizeOptions || this.sizeOptions.length === 0) && Array.isArray(this.sizes) && this.sizes.length) {
    this.sizeOptions = this.sizes;
  }
  next();
});

productSchema.index({ type: 1, isAvailable: 1 });
productSchema.index({ name: "text", description: "text", type: "text" });

module.exports = mongoose.model("Product", productSchema);
