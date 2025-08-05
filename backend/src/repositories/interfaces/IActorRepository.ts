import type { Actor } from "@/types/actor.ts";

export interface IActorRepository {
  findByUserId(username: string): Promise<Actor | null>;
}
