import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Product from '../src/models/Product.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri('aura-engine-test'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
});

describe('Analytics API', () => {
  it('returns summary and restock analytics', async () => {
    await Product.insertMany([
      { productName: 'Laptop', sku: 'AUR-2001', category: 'Electronics', price: 1000, cost: 700, stockQuantity: 0, reorderLevel: 2, lastUpdated: new Date() },
      { productName: 'Keyboard', sku: 'AUR-2002', category: 'Electronics', price: 80, cost: 45, stockQuantity: 10, reorderLevel: 5, lastUpdated: new Date() },
      { productName: 'Desk', sku: 'AUR-2003', category: 'Furniture', price: 250, cost: 150, stockQuantity: 3, reorderLevel: 2, lastUpdated: new Date() },
    ]);

    const res = await request(app).get('/api/analytics');
    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalSkus).toBe(3);
    expect(res.body.data.summary.totalInventoryValue).toBe(1000 * 0 + 80 * 10 + 250 * 3);
    expect(res.body.data.summary.outOfStockItems).toBe(1);
    expect(res.body.data.restockPriority).toHaveLength(1);
    expect(res.body.data.restockPriority[0]).toMatchObject({
      productName: 'Laptop',
      stockQuantity: 0,
      reorderLevel: 2,
    });
  });
});
