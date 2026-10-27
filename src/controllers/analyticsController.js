import { getAnalytics as getAnalyticsData } from '../services/analyticsService.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getAnalyticsData();
    return res.status(200).json(analytics);
  } catch (error) {
    return next(error);
  }
};
