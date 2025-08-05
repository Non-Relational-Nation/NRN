import { ActorModel } from "../models/actorModel.ts";
import type { Actor } from "@/types/actor.ts";

function toActor(obj: any): Actor {
  const { _id, __v, ...rest } = obj;
  return { ...rest, id: _id.toString() };
}

export const actorRepository = {
  async findByUserId(userId: string): Promise<Actor | null> {
    const doc = await ActorModel.findOne({ user_id: userId });
    return doc ? toActor(doc.toObject()) : null;
  },
};
