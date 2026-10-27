import Product from '../models/Product.js';

export async function getAnalytics() {
  const start = Date.now();

  const [summary, restockPriority, categoryValuation] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalSkus: { $sum: 1 },
          totalInventoryValue: {
            $sum: { $multiply: ['$price', '$stockQuantity'] },
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalSkus: 1,
          totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
          outOfStockItems: 1,
        },
      },
    ]),
    Product.aggregate([
      {
        $match: {
          $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
        },
      },
      {
        $sort: { stockQuantity: 1, reorderLevel: 1, _id: 1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          productName: 1,
          sku: 1,
          category: 1,
          stockQuantity: 1,
          reorderLevel: 1,
        },
      },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: '$category',
          category: { $first: '$category' },
          totalInventoryValue: {
            $sum: { $multiply: ['$price', '$stockQuantity'] },
          },
          totalItems: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: 1,
          totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
          totalItems: 1,
        },
      },
      { $sort: { totalInventoryValue: -1, category: 1 } },
    ]),
  ]);

  const summaryData = summary[0] || {
    totalSkus: 0,
    totalInventoryValue: 0,
    outOfStockItems: 0,
  };

  return {
    data: {
      summary: summaryData,
      restockPriority: restockPriority,
      categoryValuation: categoryValuation,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    },
  };
}
