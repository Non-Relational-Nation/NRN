import { ActorModel } from "@/models/actorModel.ts";
import { FollowModel } from "../models/followSchema.ts";

export const followRepository = {
 async findFollowedIdsByFollower(followerId: string): Promise<string[]> {
  const mongoose = await import('mongoose');
  let followerObjectId;
  if (followerId.startsWith('http')) {
    const actor = await ActorModel.findOne({ uri: followerId });
    if (!actor) {
      throw new Error(`Actor not found with URI ${followerId}`);
    }
    followerObjectId = actor._id;
  } else {
    try {
      followerObjectId = new mongoose.Types.ObjectId(followerId);
    } catch {
      followerObjectId = followerId;
    }
  }
  const follows = await FollowModel.find({ follower_id: followerObjectId }, { following_id: 1 });
  return follows.map(f => f.following_id.toString());
}
};
