import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Product from '../models/Product.js';
import { env } from './env.js';

let memoryServer;

const demoProducts = [
  { productName: 'Apex Pro Monitor', sku: 'AUR-1001', category: 'Electronics', price: 899, cost: 620, stockQuantity: 12, reorderLevel: 5 },
  { productName: 'Halo Wireless Mouse', sku: 'AUR-1002', category: 'Accessories', price: 79, cost: 42, stockQuantity: 34, reorderLevel: 10 },
  { productName: 'Nova Speaker Mini', sku: 'AUR-1003', category: 'Audio', price: 149, cost: 88, stockQuantity: 18, reorderLevel: 6 },
  { productName: 'Luma Desk Lamp', sku: 'AUR-1004', category: 'Lighting', price: 129, cost: 72, stockQuantity: 9, reorderLevel: 4 },
  { productName: 'Titan Workstation', sku: 'AUR-1005', category: 'Furniture', price: 1249, cost: 930, stockQuantity: 7, reorderLevel: 3 },
  { productName: 'Zen USB Hub', sku: 'AUR-1006', category: 'Electronics', price: 59, cost: 27, stockQuantity: 21, reorderLevel: 8 },
  { productName: 'Vector Keyboard', sku: 'AUR-1007', category: 'Accessories', price: 199, cost: 116, stockQuantity: 15, reorderLevel: 5 },
  { productName: 'Echo Studio Speaker', sku: 'AUR-1008', category: 'Audio', price: 349, cost: 220, stockQuantity: 10, reorderLevel: 4 },
  { productName: 'Orbit Chair', sku: 'AUR-1009', category: 'Furniture', price: 640, cost: 410, stockQuantity: 2, reorderLevel: 3 },
  { productName: 'Pulse Security Cam', sku: 'AUR-1010', category: 'Electronics', price: 259, cost: 150, stockQuantity: 0, reorderLevel: 2 },
  { productName: 'Flex LED Strip', sku: 'AUR-1011', category: 'Lighting', price: 89, cost: 41, stockQuantity: 28, reorderLevel: 9 },
  { productName: 'Link Ethernet Dock', sku: 'AUR-1012', category: 'Networking', price: 119, cost: 64, stockQuantity: 16, reorderLevel: 5 },
].map((product) => ({
  ...product,
  lastUpdated: new Date(),
}));

async function seedDemoData() {
  const existingCount = await Product.countDocuments();
  if (existingCount > 0) return;

  await Product.insertMany(demoProducts, { ordered: false });
  console.log(`Seeded ${demoProducts.length} demo inventory records.`);
}

export async function connectDB(uri = env.MONGODB_URI) {
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('aura-engine');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true,
  });

  await seedDemoData();
  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
