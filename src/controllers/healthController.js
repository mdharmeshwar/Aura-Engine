import mongoose from 'mongoose';

export const getHealth = async (req, res) => {
  const state = mongoose.connection.readyState;
  res.status(200).json({
    success: true,
    status: 'ok',
    data: {
      service: 'aura-engine',
      nodeEnv: process.env.NODE_ENV || 'development',
      dbStatus: state === 1 ? 'connected' : state === 2 ? 'connecting' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
};
