import mongoose from 'mongoose';
import { config } from './env';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await mongoose.connect(config.MONGODB_URI);
      this.isConnected = true;
      console.log(`✅ MongoDB connected to ${config.MONGODB_URI}`);
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
      this.isConnected = false;
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected');
    } catch (err) {
      console.error('❌ MongoDB disconnection error:', err);
      throw err;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const database = Database.getInstance();