import Product from '../models/Product.js';
import { inventoryQuerySchema } from '../schemas/productSchema.js';

const allowlistedSortFields = new Set(['price', 'productName', 'stockQuantity', 'category', 'lastUpdated']);

function buildInventoryFilter(query = {}) {
  const filter = {};
  const trimmedSearch = typeof query.search === 'string' ? query.search.trim() : '';
  const category = typeof query.category === 'string' ? query.category.trim() : '';
  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  const maxStock = Number(query.maxStock);
  const stockBelow = Number(query.stockBelow);

  if (trimmedSearch) {
    filter.$or = [
      { productName: { $regex: trimmedSearch, $options: 'i' } },
      { sku: { $regex: trimmedSearch, $options: 'i' } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (!Number.isNaN(minPrice)) {
    filter.price = { ...filter.price, $gte: minPrice };
  }

  if (!Number.isNaN(maxPrice)) {
    filter.price = { ...filter.price, $lte: maxPrice };
  }

  if (!Number.isNaN(maxStock)) {
    filter.stockQuantity = { ...filter.stockQuantity, $lte: maxStock };
  }

  if (!Number.isNaN(stockBelow)) {
    filter.stockQuantity = { ...filter.stockQuantity, $lt: stockBelow };
  }

  return filter;
}

function buildSort(sortInput) {
  const raw = typeof sortInput === 'string' ? sortInput.trim() : '';
  if (!raw) return { lastUpdated: -1, _id: 1 };

  const descending = raw.startsWith('-');
  const sortKey = descending ? raw.slice(1) : raw;

  if (!allowlistedSortFields.has(sortKey)) {
    throw new Error('Invalid sort field. Allowed fields: price, productName, stockQuantity, category, lastUpdated.');
  }

  const sortDirection = descending ? -1 : 1;
  return { [sortKey]: sortDirection, _id: 1 };
}

export async function getInventoryPage(rawQuery = {}) {
  const parsed = inventoryQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw Object.assign(new Error(issue.message), { statusCode: 400 });
  }

  const query = parsed.data;
  const filter = buildInventoryFilter(query);
  const sort = buildSort(query.sort);
  const safeLimit = Math.min(Math.max(query.limit || 50, 1), 100);
  const skip = (Math.max(query.page || 1, 1) - 1) * safeLimit;

  const [items, totalRecords] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
    Product.countDocuments(filter),
  ]);

  const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / safeLimit);
  const currentPage = Math.max(query.page || 1, 1);

  return {
    success: true,
    data: items.map((item) => ({
      _id: item._id,
      productName: item.productName,
      sku: item.sku,
      category: item.category,
      price: item.price,
      cost: item.cost,
      stockQuantity: item.stockQuantity,
      reorderLevel: item.reorderLevel,
      lastUpdated: item.lastUpdated,
    })),
    pagination: {
      totalRecords,
      totalPages,
      currentPage,
      limit: safeLimit,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}

export async function createProduct(data) {
  const cleaned = {
    ...data,
    lastUpdated: data.lastUpdated || new Date(),
  };

  const doc = await Product.create(cleaned);
  return doc.toObject();
}

export async function updateProductById(productId, payload) {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  Object.assign(product, payload, { lastUpdated: new Date() });
  await product.save();
  return product.toObject();
}

export async function deleteProductById(productId) {
  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  return product.toObject();
}

export async function getProductById(productId) {
  const product = await Product.findById(productId).lean();
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  return product;
}
