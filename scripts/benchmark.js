import { performance } from 'node:perf_hooks';
import Product from '../src/models/Product.js';
import { connectDB, disconnectDB } from '../src/config/database.js';

async function benchmark() {
  await connectDB();

  const start = performance.now();
  const data = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalSkus: { $sum: 1 },
        totalInventoryValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
        outOfStockItems: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } },
      },
    },
  ]);
  const durationMs = performance.now() - start;

  console.log(JSON.stringify({ durationMs, result: data[0] || null }, null, 2));
  await disconnectDB();
}

benchmark().catch((error) => {
  console.error('Benchmark failed:', error.message);
  process.exit(1);
});
