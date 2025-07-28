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

  // ActivityPub federation (for later)
  federation?: {
    enabled: boolean;
    domain: string;
    publicKey: string;
    privateKey: string;
    userAgent: string;
  };

  // Database configurations - simplified for MVP
  databases: {
    primary?: DatabaseConfig; // MongoDB for posts and user profiles
  };

  // External services
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string; // For media storage
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

  // ActivityPub federation configuration
  federation: {
    enabled: process.env.FEDERATION_ENABLED === "true",
    domain: process.env.FEDERATION_DOMAIN || "localhost:3001",
    publicKey: process.env.FEDERATION_PUBLIC_KEY || "",
    privateKey: process.env.FEDERATION_PRIVATE_KEY || "",
    userAgent: process.env.FEDERATION_USER_AGENT || "NRN/1.0.0",
  },

  databases: {
    // MongoDB for primary data (users, posts, comments)
    primary: {
      host: process.env.MONGODB_HOST || "localhost",
      port: parseInt(process.env.MONGODB_PORT || "27017"),
      name: process.env.MONGODB_DATABASE || "nrn_social",
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD,
      uri: process.env.MONGODB_URI, // For MongoDB Atlas connection string
    },
  },

  aws: {
    region: process.env.AWS_REGION || "af-south-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUrl: process.env.GOOGLE_REDIRECT_URL || "",
  },
};
