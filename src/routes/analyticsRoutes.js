import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getAnalytics));

export default router;
