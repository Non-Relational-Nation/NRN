import type { Actor } from "@/types/actor.ts";
import type { Types } from "mongoose";

export interface IActorRepository {
  findByUserId(userId: string): Promise<Actor | null>;
  findById(actorId: string): Promise<Actor | null>;
  findByUri(uri: string): Promise<Actor | null>;
}
