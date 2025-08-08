import neo4j, { Driver } from 'neo4j-driver';

const NEO4J_URI = 'bolt://localhost:7687';
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = "neo4j";

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

export const NEO4J_DB = process.env.NEO4J_DB || 'neo4j';
