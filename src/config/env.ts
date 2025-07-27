import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini-pro-vision',
  AI_API_KEY:'AIzaSyA61d1JlXZY8z1lhVYPk5Y-22vKh6kbVGg',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};