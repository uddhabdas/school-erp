const mongoose = require('mongoose');
const { seedDatabase } = require('./seed');

let mongod = null;

const connectDB = async () => {
  let connected = false;

  // Attempt remote MongoDB connection if URI provided
  if (process.env.MONGODB_URI) {
    try {
      console.log('Connecting to MongoDB via MONGODB_URI...');
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      connected = true;
    } catch (error) {
      console.warn(`[WARN] Failed to connect to MONGODB_URI (${error.message}).`);
    }
  }

  // Fallback to in-memory MongoDB if remote connection failed or URI not provided
  if (!connected) {
    try {
      console.log('Starting local in-memory MongoDB server (mongodb-memory-server)...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`Connected to local in-memory MongoDB: ${conn.connection.host}`);
      connected = true;
    } catch (memError) {
      console.error('Fatal: Failed to start both remote and local MongoDB:', memError.message);
      process.exit(1);
    }
  }

  // Ensure default seed data exists so credentials work immediately
  try {
    await seedDatabase();
  } catch (seedErr) {
    console.error('Error during auto-seed check:', seedErr.message);
  }
};

module.exports = connectDB;
