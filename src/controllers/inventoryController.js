import { isValidObjectId } from 'mongoose';
import { productSchema, updateProductSchema } from '../schemas/productSchema.js';
import { createProduct, deleteProductById, getInventoryPage, getProductById, updateProductById } from '../services/inventoryService.js';

export const getInventory = async (req, res, next) => {
  try {
    const response = await getInventoryPage(req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createInventoryItem = async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${issue.message}`,
      });
    }

    const item = await createProduct(parsed.data);
    return res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate SKU detected.',
      });
    }
    return next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: id must be a valid MongoDB ObjectId.',
      });
    }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${issue.message}`,
      });
    }

    const item = await updateProductById(id, parsed.data);
    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate SKU detected.',
      });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }
    return next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: id must be a valid MongoDB ObjectId.',
      });
    }

    const item = await deleteProductById(id);
    return res.status(200).json({
      success: true,
      data: item,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }
    return next(error);
  }
};

export const getInventoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: id must be a valid MongoDB ObjectId.',
      });
    }

    const item = await getProductById(id);
    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }
    return next(error);
  }
};
