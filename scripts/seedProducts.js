import { faker } from '@faker-js/faker';
import Product from '../src/models/Product.js';
import { connectDB, disconnectDB } from '../src/config/database.js';

const TOTAL_PRODUCTS = 50000;
const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE || 1000);
const REPLACE_EXISTING = process.argv.includes('--replace');

const CATEGORIES = ['Electronics', 'Office', 'Home', 'Audio', 'Accessories', 'Furniture', 'Lighting', 'Networking'];

function generateSku(index) {
  const prefix = faker.helpers.arrayElement(['AUR', 'PRO', 'XTR', 'NOVA', 'MTR', 'CME']);
  const suffix = String(index + 1).padStart(6, '0');
  return `${prefix}-${suffix}`;
}

function generateProduct(index) {
  const category = faker.helpers.arrayElement(CATEGORIES);
  const price = Number(faker.commerce.price({ min: 25, max: 1500, dec: 2 }));
  const cost = Number((price * faker.number.float({ min: 0.35, max: 0.9, multipleOf: 0.01 })).toFixed(2));
  const stockQuantity = faker.number.int({ min: 0, max: 200 });
  const reorderLevel = faker.number.int({ min: 2, max: 28 });

  return {
    productName: `${faker.commerce.productName()} ${faker.helpers.arrayElement(['Pro', 'Plus', 'Lite', 'Max', 'Prime'])}`.trim(),
    sku: generateSku(index),
    category,
    price: Math.max(price, cost),
    cost,
    stockQuantity,
    reorderLevel,
    lastUpdated: new Date(),
  };
}

async function ensureIndexes() {
  await Product.collection.createIndex({ productName: 1 });
  await Product.collection.createIndex({ sku: 1 }, { unique: true });
  await Product.collection.createIndex({ category: 1 });
  await Product.collection.createIndex({ category: 1, price: -1, _id: -1 });
  await Product.collection.createIndex({ category: 1, stockQuantity: 1 });
}

async function main() {
  await connectDB();
  await ensureIndexes();

  const existingCount = await Product.countDocuments();
  if (existingCount > 0 && !REPLACE_EXISTING) {
    console.log(`Database already contains ${existingCount} products. Use --replace to erase and reseed the collection.`);
    await disconnectDB();
    return;
  }

  if (REPLACE_EXISTING && existingCount > 0) {
    console.log(`Deleting ${existingCount} existing products before reseeding...`);
    await Product.deleteMany({});
  }

  const products = [];
  const usedSkus = new Set();

  for (let index = 0; index < TOTAL_PRODUCTS; index += 1) {
    let candidate = null;
    let attempts = 0;

    do {
      candidate = generateProduct(index + attempts);
      attempts += 1;
    } while (usedSkus.has(candidate.sku) && attempts < 10);

    usedSkus.add(candidate.sku);
    products.push(candidate);

    if (products.length >= BATCH_SIZE) {
      await Product.insertMany(products, { ordered: false });
      products.length = 0;
    }
  }

  if (products.length > 0) {
    await Product.insertMany(products, { ordered: false });
  }

  const insertedCount = await Product.countDocuments();
  console.log(`Seed complete. Inserted ${insertedCount} records into MongoDB.`);
  await disconnectDB();
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
