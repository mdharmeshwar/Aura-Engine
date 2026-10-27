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

describe('Validation and error handling', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('returns 404 for missing product routes', async () => {
    const res = await request(app).get('/api/inventory/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  it('returns 500 for unexpected errors safely', async () => {
    const original = Product.findById;
    Product.findById = () => {
      throw new Error('synthetic failure');
    };

    const res = await request(app).get('/api/inventory/507f1f77bcf86cd799439011');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error.');

    Product.findById = original;
  });
});
