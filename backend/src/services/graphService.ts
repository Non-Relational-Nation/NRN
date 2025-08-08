import { getNeo4jDriver, NEO4J_DB } from '../config/neo4j.js';
import { actorRepository } from '../repositories/actorRepository.ts';
import { followRepository } from '../repositories/followRepository.ts';

export class GraphService {
  static async addActor(actorId: string, actorType: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });
    try {
      await session.run(
        'MERGE (a:Actor {id: $actorId, type: $actorType})',
        { actorId, actorType }
      );
    } finally {
      await session.close();
    }
  }

  static async addFollow(followerId: string, followeeId: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    try {
      await session.run(
        'MERGE (follower:Actor {id: $followerId})',
        { followerId }
      );
      await session.run(
        'MERGE (followee:Actor {id: $followeeId})',
        { followeeId }
      );
      await session.run(
        'MATCH (follower:Actor {id: $followerId}), (followee:Actor {id: $followeeId}) MERGE (follower)-[:FOLLOWS]->(followee)',
        { followerId, followeeId }
      );
    } finally {
      await session.close();
    }
  }

  static async addPost(postId: string, authorId: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });
    try {
      await session.run(
        'MATCH (a:Actor {id: $authorId}) MERGE (p:Post {id: $postId}) MERGE (a)-[:CREATED]->(p)',
        { postId, authorId }
      );
    } finally {
      await session.close();
    }
  }

  static async addLike(actorId: string, postId: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });
    try {
      await session.run(
        'MATCH (a:Actor {id: $actorId}), (p:Post {id: $postId}) MERGE (a)-[:LIKES]->(p)',
        { actorId, postId }
      );
    } finally {
      await session.close();
    }
  }

  static async suggestUsersToFollow(userId: string): Promise<string[]> {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });
    try {
      const result = await session.run(`
        MATCH (me:Actor {id: $userId})-[:FOLLOWS]->(:Actor)-[:FOLLOWS]->(suggest:Actor)
        WHERE NOT (me)-[:FOLLOWS]->(suggest) AND suggest.id <> $userId
        RETURN DISTINCT suggest.id AS userId
        LIMIT 10
      `, { userId });
      return result.records.map(r => r.get('userId'));
    } finally {
      await session.close();
    }
  }

  static async getAllUsersToFollow(): Promise<string[]> {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });
    try {
      const result = await session.run(`
        MATCH (a:Actor)
        RETURN a.id AS userId
      `);
      console.log(result)
      const userIds = result.records.map(r => r.get('userId'));
        console.log(userIds)
      const handles: string[] = [];
      for (const userId of userIds) {
        const actor = await actorRepository.findById(userId);
        if (actor && actor.handle) {
          handles.push(actor.handle);
        }
      }
      return handles;
    } finally {
      await session.close();
    }
  }

  static async getSuggestedUsersToFollow(currentActorId: string): Promise<string[]> {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });
    try {
      const result = await session.run(`
        MATCH (a:Actor)
        RETURN a.id AS userId
      `);
      const allUserIds = result.records.map(r => r.get('userId'));
      const followingIds = await followRepository.findFollowedIdsByFollower(currentActorId);
      const suggestedIds = allUserIds.filter(
        id => id !== currentActorId && !followingIds.includes(id)
      );
      const handles: string[] = [];
      for (const userId of suggestedIds) {
        const actor = await actorRepository.findById(userId);
        if (actor && actor.handle) {
          handles.push(actor.handle);
        }
      }
      return handles;
    } finally {
      await session.close();
    }
  }
}
