import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    following_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Actor",
      required: true,
    },
    follower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Actor",
      required: true,
    },
    created: {
      type: Date,
      default: Date.now,
      validate: {
        validator: (v: Date) => !!v,
        message: "created cannot be empty",
      },
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index to simulate PRIMARY KEY(following_id, follower_id)
followSchema.index({ following_id: 1, follower_id: 1 }, { unique: true });

export const FollowModel = mongoose.model("Follow", followSchema);
