import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      integer: true,
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      integer: true,
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

productSchema.index({ category: 1, price: -1, _id: -1 });
productSchema.index({ category: 1, stockQuantity: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
