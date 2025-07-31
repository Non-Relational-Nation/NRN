import { createFederation, Endpoints, Person, RequestContext } from "@fedify/fedify";
import { MemoryKvStore, InProcessMessageQueue } from "@fedify/fedify";
import { UserModel } from "./models/userModel.ts";

const federation = createFederation({
  kv: new MemoryKvStore(), // to be changed to Redis
  queue: new InProcessMessageQueue(), // to be changed to Redis
});

federation.setActorDispatcher(
  "/users/{identifier}",
  async (ctx: RequestContext<unknown>, identifier: string) => {
    const user = await UserModel.findOne({ username: identifier });

    if (!user) return null;

    return new Person({
      id: ctx.getActorUri(identifier),
      preferredUsername: identifier,
      name: user.name,
      inbox: ctx.getInboxUri(identifier),
      endpoints: new Endpoints({
        sharedInbox: ctx.getInboxUri(),
      }),
      url: ctx.getActorUri(identifier),
    });
  }
);

federation.setInboxListeners("/users/{identifier}/inbox", "/inbox");

export default federation;
