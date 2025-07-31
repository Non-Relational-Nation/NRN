import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}`
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
