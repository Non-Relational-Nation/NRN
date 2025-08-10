import neo4j, { Driver } from "neo4j-driver";
import { config } from "./index.ts";

const NEO4J_URI = config.databases.neo4j?.uri || "bolt://localhost:7687";
const NEO4J_USER = config.databases.neo4j?.user || "neo4j";
const NEO4J_PASSWORD = config.databases.neo4j?.password || "password";
let driver: Driver;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );
  }
  return driver;
}

export function closeNeo4jDriver() {
  if (driver) {
    driver.close();
  }
}

export const NEO4J_DB = process.env.NEO4J_DB || "neo4j";
