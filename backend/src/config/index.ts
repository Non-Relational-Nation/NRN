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
    // Example configurations - uncomment and configure as needed
    // primary: {
    //   host: process.env.DB_PRIMARY_HOST || 'localhost',
    //   port: parseInt(process.env.DB_PRIMARY_PORT || '27017'),
    //   name: process.env.DB_PRIMARY_NAME || 'nrn_main',
    //   username: process.env.DB_PRIMARY_USERNAME,
    //   password: process.env.DB_PRIMARY_PASSWORD,
    // },
    // cache: {
    //   host: process.env.REDIS_HOST || 'localhost',
    //   port: parseInt(process.env.REDIS_PORT || '6379'),
    //   name: process.env.REDIS_DB || '0',
    //   password: process.env.REDIS_PASSWORD,
    // }
  },
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || ''
  }
};
