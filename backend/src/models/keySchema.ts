import mongoose from "mongoose";

const keySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["RSASSA-PKCS1-v1_5", "Ed25519"],
    required: true,
  },
  private_key: {
    type: String,
    required: true,
  },
  public_key: {
    type: String,
    required: true,
  },
});

export const KeyModel = mongoose.model("Key", keySchema);
