import { FollowModel } from "../models/followSchema.ts";

export const followRepository = {
  async findFollowedIdsByFollower(followerId: string): Promise<string[]> {
    const mongoose = await import('mongoose');
    let followerObjectId;
    try {
      followerObjectId = new mongoose.Types.ObjectId(followerId);
    } catch {
      followerObjectId = followerId;
    }
    const follows = await FollowModel.find({ follower_id: followerObjectId }, { following_id: 1 });
    return follows.map(f => f.following_id.toString());
  },
};
