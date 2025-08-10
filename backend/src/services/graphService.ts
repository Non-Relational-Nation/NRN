import { getNeo4jDriver, NEO4J_DB } from '../config/neo4j.js';
import { actorRepository } from '../repositories/actorRepository.ts';

export class GraphService {
  static async addActor(actorId: string, actorType: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    try {
      await session.run(
        `
        MERGE (a:Actor {id: $actorId})
        ON CREATE SET a.type = $actorType, a.createdAt = timestamp()
        ON MATCH SET a.type = $actorType
        `,
        { actorId, actorType }
      );
    } finally {
      await session.close();
    }
  }

  static async addFollow(followerId: string, followeeId: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    const tx = session.beginTransaction();
    try {
      await tx.run(
        `
        MERGE (follower:Actor {id: $followerId})
        MERGE (followee:Actor {id: $followeeId})
        MERGE (follower)-[r:FOLLOWS]->(followee)
        ON CREATE SET r.since = timestamp()
        `,
        { followerId, followeeId }
      );
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      console.error("Failed to add follow relationship:", err);
      throw err;
    } finally {
      await session.close();
    }
  }

  static async addPost(postId: string, authorId: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    try {
      await session.run(
        `
        MATCH (a:Actor {id: $authorId})
        MERGE (p:Post {id: $postId})
        ON CREATE SET p.createdAt = timestamp()
        MERGE (a)-[:CREATED]->(p)
        `,
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
        `
        MATCH (a:Actor {id: $actorId}), (p:Post {id: $postId})
        MERGE (a)-[:LIKES]->(p)
        `,
        { actorId, postId }
      );
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
      const userIds = result.records.map(r => r.get('userId'));

      const handles: string[] = [];
      for (const userId of userIds) {
        const actor = await actorRepository.findById(userId);
        if (actor?.handle) {
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
        MATCH (suggestion:Actor)
        WHERE NOT EXISTS((:Actor {id: $currentActorId})-[:FOLLOWS]->(suggestion))
          AND suggestion.id <> $currentActorId
        WITH suggestion, COUNT { (suggestion)<-[:FOLLOWS]-() } as popularity
        RETURN suggestion.id as userId, popularity
        ORDER BY popularity DESC
        LIMIT 20
      `, { currentActorId });

      const userIds = result.records.map(r => r.get('userId'));
      const handles: string[] = [];
      
      for (const userId of userIds) {
        const actor = await actorRepository.findById(userId);
        if (actor?.handle) {
          handles.push(actor.handle);
        }
      }
      return handles;
    } finally {
      await session.close();
    }
  }

  static async getFollowRecommendations(currentActorId: string, limit: number = 5): Promise<Array<{userId: string, score: number, reason: string}>> {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    try {
      const result = await session.run(`
        MATCH (suggestion:Actor)
        WHERE NOT EXISTS((:Actor {id: $currentActorId})-[:FOLLOWS]->(suggestion))
          AND suggestion.id <> $currentActorId
        WITH suggestion, COUNT { (suggestion)<-[:FOLLOWS]-() } as popularity
        RETURN suggestion.id as userId,
               popularity as score,
               CASE WHEN popularity > 0 
                    THEN 'Popular user with ' + toString(popularity) + ' followers'
                    ELSE 'New user to follow' END as reason
        ORDER BY score DESC
        LIMIT $limit
      `, { currentActorId, limit });

      return result.records.map(record => ({
        userId: record.get('userId'),
        score: record.get('score').toNumber(),
        reason: record.get('reason')
      }));
    } finally {
      await session.close();
    }
  }

  static async getNetworkStats(actorId: string): Promise<{followers: number, following: number, mutualConnections: number, networkReach: number}> {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    try {
      const result = await session.run(`
        MATCH (me:Actor {id: $actorId})
        OPTIONAL MATCH (me)<-[:FOLLOWS]-(follower)
        OPTIONAL MATCH (me)-[:FOLLOWS]->(following)
        OPTIONAL MATCH (me)-[:FOLLOWS]->(friend)-[:FOLLOWS]->(me)
        OPTIONAL MATCH (me)-[:FOLLOWS*2..3]-(reachable)
        RETURN count(DISTINCT follower) as followers,
               count(DISTINCT following) as following,
               count(DISTINCT friend) as mutualConnections,
               count(DISTINCT reachable) as networkReach
      `, { actorId });

      const record = result.records[0];
      return {
        followers: record.get('followers').toNumber(),
        following: record.get('following').toNumber(),
        mutualConnections: record.get('mutualConnections').toNumber(),
        networkReach: record.get('networkReach').toNumber()
      };
    } finally {
      await session.close();
    }
  }

  static async removeFollow(followerId: string, followeeId: string) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    try {
      await session.run(`
        MATCH (follower:Actor {id: $followerId})-[r:FOLLOWS]->(followee:Actor {id: $followeeId})
        DELETE r
      `, { followerId, followeeId });
    } finally {
      await session.close();
    }
  }

  static async findShortestPath(fromActorId: string, toActorId: string): Promise<string[]> {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });

    try {
      const result = await session.run(`
        MATCH path = shortestPath((from:Actor {id: $fromActorId})-[:FOLLOWS*..6]->(to:Actor {id: $toActorId}))
        RETURN [node in nodes(path) | node.username] as usernames
      `, { fromActorId, toActorId });

      return result.records.length > 0 ? result.records[0].get('usernames') : [];
    } finally {
      await session.close();
    }
  }

  static async ensureActors(actors: { id: string; username: string }[]) {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: NEO4J_DB });
    const tx = session.beginTransaction();

    try {
      for (const actor of actors) {
        await tx.run(
          `
          MERGE (a:Actor {id: $id})
          ON CREATE SET a.username = $username, a.createdAt = timestamp()
          ON MATCH SET a.username = $username
          `,
          { id: actor.id, username: actor.username }
        );
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      console.error('Failed to ensure actors in Neo4j:', err);
      throw err;
    } finally {
      await session.close();
    }
  }
}
