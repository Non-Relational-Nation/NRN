import type mongoose from "mongoose";
import { ActorModel } from "../models/actorModel.ts";
import { UserModel } from "../models/userModel.ts";
export const findUserByUsername = async (username: string) => {
  return UserModel.findOne({ username });
};

export async function upsertUser(
  userId: mongoose.Types.ObjectId,
  username: string
) {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { username } },
    { upsert: true }
  );
}

export async function upsertActor(
  userId: mongoose.Types.ObjectId,
  {
    username,
    name,
    context,
  }: {
    username: string;
    name: string;
    context: any;
  }
) {
  const handle = `@${username}@${context.hostname}`;
  await ActorModel.updateOne(
    { user_id: userId },
    {
      $set: {
        user_id: userId,
        uri: context.getActorUri(username).href,
        handle,
        name,
        inbox_url: context.getInboxUri(username).href,
        shared_inbox_url: context.getInboxUri().href,
        url: context.getActorUri(username).href,
      },
    },
    { upsert: true }
  );
}
