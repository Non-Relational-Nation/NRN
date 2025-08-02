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
        followers: ctx.getFollowersUri(identifier),
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
  .on(Follow, async (ctx, follow) => {
    if (follow.objectId == null) return;

    const object = ctx.parseUri(follow.objectId);

    if (object === null || object.type !== "actor") return;

    const follower = await follow.getActor();

    if (!follower?.id || !follower.inboxId) return;

    const user = await UserModel.findOne({ username: object.identifier });

    const followingId = user
      ? await ActorModel.findOne({ user_id: user.id })
      : null;

    if (!followingId) return;

    const followerId = (
      await ActorModel.findOneAndUpdate(
        { uri: follower.id.href },
        {
          handle: await getActorHandle(follower),
          name: follower.name?.toString(),
          inbox_url: follower.inboxId.href,
          shared_inbox_url: follower.endpoints?.sharedInbox?.href,
          url: follower.url?.href,
        },
        {
          new: true,
          upsert: true,
        }
      )
    )?._id;

    await FollowModel.create({
      following_id: followingId,
      follower_id: followerId,
    });

    const accept = new Accept({
      actor: follow.objectId,
      to: follow.actorId,
      object: follow,
    });

    await ctx.sendActivity(object, follower, accept);
  })
  .on(Undo, async (ctx, undo) => {
    const object = await undo.getObject();
    if (!(object instanceof Follow)) return;

    if (undo.actorId == null || object.objectId == null) return;

    const parsed = ctx.parseUri(object.objectId);
    if (parsed == null || parsed.type !== "actor") return;

    const user = await UserModel.findOne({ username: parsed.identifier });
    if (!user) throw new Error("User not found");

    const followingActor = await ActorModel.findOne({ user_id: user._id });
    if (!followingActor) throw new Error("Following actor not found");

    const followerActor = await ActorModel.findOne({ uri: undo.actorId.href });
    if (!followerActor) throw new Error("Follower actor not found");

    await FollowModel.deleteOne({
      following_id: followingActor._id,
      follower_id: followerActor._id,
    });
  });

federation
  .setFollowersDispatcher(
    "/users/{identifier}/followers",
    async (ctx, identifier, cursor) => {
      const user = await UserModel.findOne({ username: identifier });
      if (!user) return { items: [] };

      const actor = await ActorModel.findOne({ user_id: user._id });
      if (!actor) return { items: [] };

      const follows = await FollowModel.find({ following_id: actor.user_id })
        .sort({ created: -1 })
        .populate("follower_id");

      const items: Recipient[] = follows.map((f) => {
        const follower = f as unknown as Actor;
        return {
          id: new URL(follower.uri),
          inboxId: new URL(follower.inbox_url),
          endpoints: follower.shared_inbox_url
            ? { sharedInbox: new URL(follower.shared_inbox_url) }
            : null,
        };
      });

      return { items };
    }
  )
  .setCounter(async (ctx, identifier) => {
    const user = await UserModel.findOne({ username: identifier });
    if (!user) return 0;

    const actor = await ActorModel.findOne({ user_id: user._id });
    if (!actor) return 0;

    const count = await FollowModel.countDocuments({ following_id: actor._id });

    return count;
  });

export default federation;
