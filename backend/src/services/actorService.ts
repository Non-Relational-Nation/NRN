import { actorRepository } from "@/repositories/actorRepository.ts";
import type { IActorRepository } from "@/repositories/interfaces/IActorRepository.ts";
import type { Type } from "@aws-sdk/client-s3";
import { Actor } from "@fedify/fedify";
import type { Types } from "mongoose";

export class ActorService {
  constructor(private actorRepository: IActorRepository) {}

  getActorByUserId = async (userId: string) => {
    return this.actorRepository.findByUserId(userId);
  };

  getActorById = async (actorId: string) => {
    return this.actorRepository.findById(actorId);
  };

  getActorByUri = async (uri: string) => {
    return this.actorRepository.findByUri(uri);
  };

  async fetchActorByHandle(handle: string): Promise<any | null> {
    if (handle.startsWith("@")) {
      handle = handle.slice(1);
    }
    let [username, domain] = handle.split("@");
    if (!domain) {
      domain = "d3m0gyk7rj0vr1.cloudfront.net";
    }
    const protocol = domain.includes("localhost") ? "http" : "https";
    domain = domain.includes("localhost") ? "localhost:3001" : domain;

    let webfingerResponse;
    try {
      webfingerResponse = await fetch(
        `${protocol}://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`
      );
    } catch (error) {
      return null;
    }
    if (!webfingerResponse.ok) {
      return null;
    }
    const webfingerData = await webfingerResponse.json();
    let actorResponse;
    try {
      actorResponse = await fetch(webfingerData.links[0].href, {
        headers: { Accept: "application/activity+json" },
      });
    } catch (error) {
      return null;
    }
    if (!actorResponse.ok) {
      return null;
    }
    return await actorResponse.json();
  }
}

const actorService = new ActorService(actorRepository);
export default actorService;
