import Product from '../src/models/Product.js';
import { connectDB, disconnectDB } from '../src/config/database.js';

const confirmFlag = process.argv.includes('--confirm');
const isLocalTestDb = (process.env.MONGODB_URI || '').includes('localhost') || (process.env.MONGODB_URI || '').includes('127.0.0.1');

if (!confirmFlag || !isLocalTestDb) {
  console.error('Destructive reset requires --confirm and a local MongoDB environment.');
  process.exit(1);
}

async function main() {
  await connectDB();
  const count = await Product.countDocuments();
  await Product.deleteMany({});
  console.log(`Deleted ${count} products.`);
  await disconnectDB();
}

main().catch((error) => {
  console.error('Clear failed:', error.message);
  process.exit(1);
});
