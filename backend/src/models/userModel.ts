import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: String,
});

export const UserModel = mongoose.model("User", userSchema);
