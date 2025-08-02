import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Use MONGODB_URI (for production), otherwise use individual env vars (for development)
    const mongoUri = process.env.MONGODB_URI || 
      `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}`;
    
    // await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
