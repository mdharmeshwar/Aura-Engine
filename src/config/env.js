import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || '1mb',
};

export function getAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGIN || env.CLIENT_ORIGIN;
  if (!raw || raw.trim() === '*') return ['*'];
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}
