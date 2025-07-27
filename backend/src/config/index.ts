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
  
  // Database configurations - extensible for multiple NoSQL databases
  databases: {
    primary?: DatabaseConfig;
    cache?: DatabaseConfig;
    media?: DatabaseConfig;
    analytics?: DatabaseConfig;
    search?: DatabaseConfig;
  };
  
  // External services
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  databases: {
    // MongoDB for primary data (users, posts, relationships)
    primary: {
      host: process.env.MONGODB_HOST || 'localhost',
      port: parseInt(process.env.MONGODB_PORT || '27017'),
      name: process.env.MONGODB_DATABASE || 'nrn_social',
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD,
      uri: process.env.MONGODB_URI // For MongoDB Atlas connection string
    },
    
    // Redis for caching and real-time features
    cache: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      name: process.env.REDIS_DB || '0',
      password: process.env.REDIS_PASSWORD,
      uri: process.env.REDIS_URI // For Redis Cloud connection string
    }
  },
  
  aws: {
    region: process.env.AWS_REGION || 'af-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || ''
  }
};
