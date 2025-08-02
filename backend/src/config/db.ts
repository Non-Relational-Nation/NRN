import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Use MONGODB_URI (for production), otherwise use individual env vars (for development)
    const mongoUri =`mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}`;
    
    console.log(`Attempting to connect to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    
    // Only exit in development, in production let the app run and report via health check
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err;
  }
};
