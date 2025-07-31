import { database } from '../config/database';
import { MongoUserRepository } from '../repositories/implementations/MongoUserRepository';
import { UserService } from '../services/userService';

async function testDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await database.connect();
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test user repository
    const userRepository = new MongoUserRepository();
    const userService = new UserService(userRepository);
    
    // Test creating a user
    console.log('👤 Testing user creation...');
    const testUser = await userService.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
      bio: 'This is a test user'
    });
    
    console.log('✅ User created:', {
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      displayName: testUser.displayName
    });
    
    // Test finding user by email
    console.log('🔍 Testing user lookup by email...');
    const foundUser = await userService.getUserByEmail('test@example.com');
    
    if (foundUser) {
      console.log('✅ User found by email:', foundUser.username);
    } else {
      console.log('❌ User not found by email');
    }
    
    // Test searching users
    console.log('🔍 Testing user search...');
    const searchResults = await userService.searchUsers('test');
    console.log(`✅ Found ${searchResults.length} users matching 'test'`);
    
    // Test authentication
    console.log('🔐 Testing authentication...');
    const authResult = await userService.authenticate({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (authResult) {
      console.log('✅ Authentication successful');
    } else {
      console.log('❌ Authentication failed');
    }
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await database.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDatabase(); 