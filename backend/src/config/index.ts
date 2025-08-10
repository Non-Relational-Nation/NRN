import dotenv from "dotenv";
dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username?: string;
  password?: string;
  uri?: string;
}

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  frontendUrl: string;
  serverUrl?: string;
  serverDomain?: string;

  federation?: {
    enabled: boolean;
    domain: string;
    publicKey: string;
    privateKey: string;
    userAgent: string;
  };

  databases: {
    primary?: DatabaseConfig; 
    redis?: { url: string 
      host: string; 
      port: number; 
      db?: number; 
      username?: string; 
      password?: string; 
    }; 
    neo4j?: {
      uri: string;
      user: string;
      password: string;
    }
  };

  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string; 
  };

  google: {
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "3001"),
  host: process.env.HOST || "localhost",
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  serverUrl: process.env.SERVER_URL || "http://localhost:3001",
  serverDomain: process.env.SERVER_DOMAIN || "localhost:3001",

  federation: {
    enabled: process.env.FEDERATION_ENABLED === "true",
    domain: process.env.FEDERATION_DOMAIN || "localhost:3001",
    publicKey: process.env.FEDERATION_PUBLIC_KEY || "",
    privateKey: process.env.FEDERATION_PRIVATE_KEY || "",
    userAgent: process.env.FEDERATION_USER_AGENT || "NRN/1.0.0",
  },

  databases: {
    primary: {
      host: process.env.MONGODB_HOST || "localhost",
      port: parseInt(process.env.MONGODB_PORT || "27017"),
      name: process.env.MONGODB_DATABASE || "nrn_social",
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD,
      uri: process.env.MONGODB_URI, 
    },

    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      url: process.env.REDIS_URL || "redis://localhost:6379",
    },
    neo4j: {
      uri: process.env.NEO4J_URI || "bolt://localhost:7687",
      user: process.env.NEO4J_USER || "neo4j",
      password: process.env.NEO4J_PASSWORD || "password",
    }
  },

  aws: {
    region: process.env.AWS_REGION || "af-south-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "your-google-client-id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "your-google-client-secret",
    redirectUrl: process.env.GOOGLE_REDIRECT_URL || "http://localhost:3001/auth/google/callback",
  },
};