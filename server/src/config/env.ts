import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resourceloop',
  JWT_SECRET: process.env.JWT_SECRET || 'resourceloop_default_secure_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  INSTITUTION_NAME: process.env.INSTITUTION_NAME || 'Apex University of Technology & Sciences',
  INSTITUTION_TIMEZONE: process.env.INSTITUTION_TIMEZONE || 'Asia/Kolkata',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};
