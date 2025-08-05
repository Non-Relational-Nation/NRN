import { actorRepository } from "@/repositories/actorRepository.ts";
import type { IActorRepository } from "@/repositories/interfaces/IActorRepository.ts";

export class ActorService {
  constructor(private actorRepository: IActorRepository) {}

  getActorByUserId = async (userId: string) => {
    return this.actorRepository.findByUserId(userId);
  };

  getActorById = async (actorId: string) => {
    return this.actorRepository.findById(actorId);
  };
}

const actorService = new ActorService(actorRepository);
export default actorService;
