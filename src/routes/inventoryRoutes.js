import express from 'express';
import { createInventoryItem, deleteInventoryItem, getInventory, getInventoryById, updateInventoryItem } from '../controllers/inventoryController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { productSchema, updateProductSchema } from '../schemas/productSchema.js';

const router = express.Router();

router.get('/', asyncHandler(getInventory));
router.post('/', validateRequest(productSchema), asyncHandler(createInventoryItem));
router.get('/:id', asyncHandler(getInventoryById));
router.put('/:id', validateRequest(updateProductSchema, 'body'), asyncHandler(updateInventoryItem));
router.delete('/:id', asyncHandler(deleteInventoryItem));

export default router;
