/**
 * @file database.ts
 * @description Mongoose connection configuration with event logging.
 * @module Config
 * @author VehicleMarket Backend
 */

// Load environment/development.env (MONGO_URI, DB_NAME) before anything reads
// process.env, so every connectDatabase() caller uses the same database as the
// running app — otherwise seeds silently fall back to localhost/vehicle-marketplace.
import './environment';
import mongoose from 'mongoose';
import logger from '../logger/index';

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected');
});

export async function connectDatabase(): Promise<void> {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.DB_NAME || 'vehicle-marketplace',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connection established successfully');
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to connect to MongoDB', { error: err.message });
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Mongoose disconnected');
}

export default mongoose;
