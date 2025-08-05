// import { validateRegisterInput } from "@/validators/userValidator.ts";
import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import mongoose from "mongoose";
import { IUserRepository } from "@/repositories/interfaces/IUserRepository.ts";
import { userRepository } from "@/repositories/userRepository.ts";
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
