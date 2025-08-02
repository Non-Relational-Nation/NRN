import {
  createFederation,
  Endpoints,
  Person,
  RequestContext,
  exportJwk,
  generateCryptoKeyPair,
  importJwk,
  Follow,
  getActorHandle,
  Accept,
  Undo,
  type Recipient,
} from "@fedify/fedify";
import { MemoryKvStore, InProcessMessageQueue } from "@fedify/fedify";
import { UserModel } from "./models/userModel.ts";
import { KeyModel } from "./models/keySchema.ts";
import { ActorModel } from "./models/actorModel.ts";
import { FollowModel } from "./models/followSchema.ts";
import type { Actor } from "./types/actor.ts";

type KeyType = "RSASSA-PKCS1-v1_5" | "Ed25519";

const federation = createFederation({
  kv: new MemoryKvStore(), // to be changed to Redis
  queue: new InProcessMessageQueue(), // to be changed to Redis
});

federation
  .setActorDispatcher(
    "/users/{identifier}",
    async (ctx: RequestContext<unknown>, identifier: string) => {
      const user = await UserModel.findOne({ username: identifier });

      if (!user) return null;

      const keys = await ctx.getActorKeyPairs(identifier);
      return new Person({
        id: ctx.getActorUri(identifier),
        preferredUsername: identifier,
        name: user.name,
        inbox: ctx.getInboxUri(identifier),
        endpoints: new Endpoints({
          sharedInbox: ctx.getInboxUri(),
        }),
        url: ctx.getActorUri(identifier),
        publicKey: keys[0]?.cryptographicKey,
        assertionMethods: keys.map((k) => k.multikey),
        followers: ctx.getFollowersUri(identifier)
      });
    }
  )
  .setKeyPairsDispatcher(async (ctx, identifier) => {
    const pairs: CryptoKeyPair[] = [];
    const user = await UserModel.findOne({ username: identifier });

    if (!user) return pairs;

    const keys = await KeyModel.find({ user_id: user.id }).lean();

    const keyMap = Object.fromEntries(keys.map((key) => [key.type, key]));

    for (const keyType of ["RSASSA-PKCS1-v1_5", "Ed25519"]) {
      if (!keyMap[keyType]) {
        console.log(
          `The actor ${identifier} is missing a ${keyType} key; generating...`,
          { identifier, keyType }
        );

        // Step 2: Generate key pair
        const { privateKey, publicKey } = await generateCryptoKeyPair(
          keyType as KeyType
        );

        const privateJwk = JSON.stringify(await exportJwk(privateKey));
        const publicJwk = JSON.stringify(await exportJwk(publicKey));

        await KeyModel.create({
          user_id: user.id,
          type: keyType,
          private_key: privateJwk,
          public_key: publicJwk,
        });

        pairs.push({ privateKey, publicKey });
      } else {
        pairs.push({
          privateKey: await importJwk(
            JSON.parse(keyMap[keyType].private_key),
            "private"
          ),
          publicKey: await importJwk(
            JSON.parse(keyMap[keyType].public_key),
            "public"
          ),
        });
      }
    }

    return pairs;
  });

federation
  .setInboxListeners("/users/{identifier}/inbox", "/inbox")

export default federation;
