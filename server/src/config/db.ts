import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[Database] MongoDB disconnected');
}
