//RUN: npm run setup:user-collection TO CREATE USER COLLECTION
const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv/config');

async function createUserCollection() {
  const uri = process.env.MONGODB_URI || `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || '27017'}`;
  const dbName = process.env.MONGODB_DATABASE || 'nrn_social';
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db(dbName);
    
    // Create users collection
    const usersCollection = db.collection('users');
    
    // Create indexes for better performance
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ createdAt: 1 });
    
    console.log('Users collection created with indexes');
    
    // Insert a sample user (with hashed password)
    const saltRounds = 10;
    const plainPassword = 'password123';
    
    const sampleUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: plainPassword,
      displayName: 'Test User',
      bio: 'This is a sample user for testing purposes',
      avatar: null,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(sampleUser);
    console.log(`Sample user created with ID: ${result.insertedId}`);
    
    // Verify the user was created
    const createdUser = await usersCollection.findOne({ _id: result.insertedId });
    console.log('Sample user details:', {
      id: createdUser._id.toString(),
      username: createdUser.username,
      email: createdUser.email,
      displayName: createdUser.displayName
    });
    
    console.log('User collection setup completed successfully!');
  } catch (error) {
    console.error('Error setting up user collection:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createUserCollection();