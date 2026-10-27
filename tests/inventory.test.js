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

describe('Inventory API', () => {
  it('creates a valid product', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({
        productName: 'Audio Dock',
        sku: 'AUR-1001',
        category: 'Electronics',
        price: 120,
        cost: 90,
        stockQuantity: 15,
        reorderLevel: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sku).toBe('AUR-1001');
  });

  it('rejects price below cost', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({
        productName: 'Phone',
        sku: 'AUR-1002',
        category: 'Electronics',
        price: 50,
        cost: 75,
        stockQuantity: 10,
        reorderLevel: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('price must be greater than or equal to cost');
  });

  it('rejects negative stock quantity', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({
        productName: 'Headset',
        sku: 'AUR-1003',
        category: 'Audio',
        price: 80,
        cost: 60,
        stockQuantity: -5,
        reorderLevel: 3,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('stockQuantity');
  });

  it('rejects negative price or cost', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({
        productName: 'Monitor',
        sku: 'AUR-1004',
        category: 'Electronics',
        price: -10,
        cost: 40,
        stockQuantity: 5,
        reorderLevel: 2,
      });

    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({ productName: 'Keyboard' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid MongoDB ID', async () => {
    const res = await request(app).put('/api/inventory/not-an-id').send({ price: 100 });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate SKU', async () => {
    await Product.create({
      productName: 'Laptop',
      sku: 'AUR-1005',
      category: 'Electronics',
      price: 200,
      cost: 140,
      stockQuantity: 4,
      reorderLevel: 2,
      lastUpdated: new Date(),
    });

    const res = await request(app)
      .post('/api/inventory')
      .send({
        productName: 'Laptop Replacement',
        sku: 'AUR-1005',
        category: 'Electronics',
        price: 220,
        cost: 160,
        stockQuantity: 8,
        reorderLevel: 3,
      });

    expect(res.status).toBe(409);
  });

  it('updates a product with valid values', async () => {
    const created = await Product.create({
      productName: 'Desk Lamp',
      sku: 'AUR-1006',
      category: 'Lighting',
      price: 80,
      cost: 60,
      stockQuantity: 12,
      reorderLevel: 2,
      lastUpdated: new Date(),
    });

    const res = await request(app).put(`/api/inventory/${created._id}`).send({ stockQuantity: 24, price: 90 });
    expect(res.status).toBe(200);
    expect(res.body.data.stockQuantity).toBe(24);
  });

  it('lists inventory with pagination and filters', async () => {
    await Product.insertMany([
      { productName: 'Laptop', sku: 'AUR-1010', category: 'Electronics', price: 999, cost: 700, stockQuantity: 5, reorderLevel: 2, lastUpdated: new Date() },
      { productName: 'Laptop Bag', sku: 'AUR-1011', category: 'Accessories', price: 120, cost: 70, stockQuantity: 12, reorderLevel: 3, lastUpdated: new Date() },
      { productName: 'Tablet', sku: 'AUR-1012', category: 'Electronics', price: 600, cost: 400, stockQuantity: 8, reorderLevel: 1, lastUpdated: new Date() },
    ]);

    const res = await request(app).get('/api/inventory?page=1&limit=2&category=Electronics&sort=-price');
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].productName).toBe('Laptop');
  });
});
