import { Schema, model, Types } from "mongoose";

const likeSchema = new Schema(
  {
    actor_id: { type: Types.ObjectId, ref: "Actor", required: true },
    post_id: { type: Types.ObjectId, ref: "ActivityPubPost", required: true },
  },
  { timestamps: true }
);

likeSchema.index({ actor_id: 1, post_id: 1 }, { unique: true });

export const LikeModel = model("Like", likeSchema);
