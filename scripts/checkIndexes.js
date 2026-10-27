import Product from '../src/models/Product.js';
import { connectDB, disconnectDB } from '../src/config/database.js';

async function main() {
  await connectDB();
  const indexes = await Product.collection.indexes();
  console.log('MongoDB indexes:', indexes.map((index) => ({ name: index.name, key: index.key })));
  await disconnectDB();
}

main().catch((error) => {
  console.error('Index check failed:', error.message);
  process.exit(1);
});
