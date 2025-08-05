import type { Actor } from "@/types/actor.ts";

export interface IActorRepository {
  findByUserId(userId: string): Promise<Actor | null>;
  findById(actorId: string): Promise<Actor | null>;
}
