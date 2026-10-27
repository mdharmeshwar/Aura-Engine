import { z } from 'zod';

const nonEmptyString = (fieldName) =>
  z.string({ required_error: `${fieldName} is required.` }).trim().min(1, `${fieldName} cannot be empty.`);

export const productSchema = z
  .object({
    productName: nonEmptyString('productName'),
    sku: nonEmptyString('sku'),
    category: nonEmptyString('category'),
    price: z.number({ invalid_type_error: 'price must be a number.' }).nonnegative('price must be a nonnegative number.'),
    cost: z.number({ invalid_type_error: 'cost must be a number.' }).nonnegative('cost must be a nonnegative number.'),
    stockQuantity: z.number({ invalid_type_error: 'stockQuantity must be a number.' }).int('stockQuantity must be an integer.').nonnegative('stockQuantity must be a nonnegative integer.'),
    reorderLevel: z.number({ invalid_type_error: 'reorderLevel must be a number.' }).int('reorderLevel must be an integer.').nonnegative('reorderLevel must be a nonnegative integer.'),
    lastUpdated: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.price < data.cost) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: 'price must be greater than or equal to cost.',
      });
    }
  });

export const updateProductSchema = z.object({
  productName: nonEmptyString('productName').optional(),
  sku: nonEmptyString('sku').optional(),
  category: nonEmptyString('category').optional(),
  price: z.number({ invalid_type_error: 'price must be a number.' }).nonnegative('price must be a nonnegative number.').optional(),
  cost: z.number({ invalid_type_error: 'cost must be a number.' }).nonnegative('cost must be a nonnegative number.').optional(),
  stockQuantity: z.number({ invalid_type_error: 'stockQuantity must be a number.' }).int('stockQuantity must be an integer.').nonnegative('stockQuantity must be a nonnegative integer.').optional(),
  reorderLevel: z.number({ invalid_type_error: 'reorderLevel must be a number.' }).int('reorderLevel must be an integer.').nonnegative('reorderLevel must be a nonnegative integer.').optional(),
  lastUpdated: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  if (data.price !== undefined && data.cost !== undefined && data.price < data.cost) {
    ctx.addIssue({
      code: 'custom',
      path: ['price'],
      message: 'price must be greater than or equal to cost.',
    });
  }
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  stockBelow: z.coerce.number().int().nonnegative().optional(),
  maxStock: z.coerce.number().int().nonnegative().optional(),
  sort: z.string().optional(),
}).refine((data) => {
  if (data.minPrice !== undefined && data.maxPrice !== undefined) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: 'minPrice must be less than or equal to maxPrice.',
  path: ['minPrice'],
});

export const parseValidationFailure = (error) => {
  const issue = error.issues[0];
  if (!issue) return 'Validation failed.';
  return `Validation failed: ${issue.message || 'Invalid value provided.'}`;
};
