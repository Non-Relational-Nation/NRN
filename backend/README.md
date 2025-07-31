# Non-Relational Nation Backend

A social media backend built with TypeScript, Express, and MongoDB, featuring ActivityPub federation support and comprehensive post management.

## Features

- 🔐 **User Authentication**: Register, login, and logout functionality
- 👥 **User Management**: Profile management and user search
- 📝 **Post Management**: Create, read, update, delete, and search posts
- 🌐 **ActivityPub Support**: Federated social media capabilities
- 🗄️ **MongoDB Integration**: Persistent data storage with both MongoDB and mock repositories
- 🧪 **Comprehensive Testing**: Unit tests with Jest and Supertest
- 🔄 **Repository Pattern**: Clean separation between data access and business logic

## Prerequisites

- Node.js >= 18.0.0
- MongoDB instance (local or cloud)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3001
HOST=localhost
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nrn_backend

# Federation Configuration (for ActivityPub)
FEDERATION_DOMAIN=localhost:3001
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
# Run all tests
npm test

# Test database connection
npm run test:db

# Run specific test files
npm test -- --testNamePattern="Post Routes"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users?q=query` - Search users

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get a specific post with author information
- `PUT /api/posts/:id` - Update a post (author only)
- `DELETE /api/posts/:id` - Delete a post (author only)
- `GET /api/posts/author/:authorId` - Get posts by specific author
- `GET /api/posts/search?q=query` - Search posts by content
- `GET /api/posts` - Get public posts
- `GET /api/posts/feed` - Get user's personalized feed

### ActivityPub (Federation)
- `GET /.well-known/webfinger` - WebFinger discovery
- `GET /users/:username` - Get actor profile
- `POST /users/:username/inbox` - User inbox
- `GET /users/:username/outbox` - User outbox
- `GET /users/:username/followers` - User followers
- `GET /users/:username/following` - User following
- `POST /inbox` - Shared inbox

## Database Schema

### Users Collection
```typescript
{
  _id: ObjectId,
  username: string,
  email: string,
  password: string,
  displayName: string,
  bio?: string,
  avatar?: string,
  followersCount: number,
  followingCount: number,
  postsCount: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Posts Collection
```typescript
{
  _id: ObjectId,
  authorId: string,
  content: string,
  title?: string,
  visibility: 'public' | 'private' | 'followers',
  likesCount: number,
  commentsCount: number,
  sharesCount: number,
  createdAt: Date,
  updatedAt: Date
}
```

## Architecture

The application follows a clean architecture pattern with dependency injection:

### Layers
- **Controllers**: Handle HTTP requests and responses (`UserController`, `PostController`, `ActivityPubController`)
- **Services**: Business logic and validation (`UserService`, `PostService`)
- **Repositories**: Data access layer with interface abstraction
  - **MongoDB Implementation**: `MongoUserRepository`, `MongoPostRepository`
  - **Mock Implementation**: `MockUserRepository`, `MockPostRepository` (for testing)
- **Types**: TypeScript type definitions (`User`, `Post`, `CreatePostData`, etc.)
- **Config**: Configuration management and database connection

### Key Design Patterns
- **Repository Pattern**: Abstract data access through interfaces
- **Dependency Injection**: Services receive repository dependencies
- **Singleton Pattern**: Database connection management
- **Factory Pattern**: Test app creation with isolated dependencies

## Testing

The application includes comprehensive tests with isolated test environments:

### Test Structure
- **Unit Tests**: Controller and service logic validation
- **Integration Tests**: API endpoint testing with Supertest
- **Database Tests**: MongoDB functionality verification
- **Mock Testing**: Isolated testing with mock repositories

### Test Features
- **Isolated Test Environment**: Each test gets fresh mock repositories
- **Comprehensive Coverage**: All CRUD operations and edge cases
- **Validation Testing**: Input validation and error handling
- **Authorization Testing**: User permission checks

### Running Tests
```bash
# All tests
npm test

# Specific test file
npm test -- src/__tests__/posts.test.ts

# Specific test pattern
npm test -- --testNamePattern="should create a new post"

# Database connection test
npm run test:db
```

## Development Workflow

### Adding New Features
1. Define TypeScript interfaces in `src/types/`
2. Create repository interface in `src/repositories/interfaces/`
3. Implement MongoDB repository in `src/repositories/implementations/`
4. Create mock repository for testing
5. Implement service layer with business logic
6. Create controller with HTTP handling
7. Add routes in `src/routes/`
8. Write comprehensive tests
9. Update test helpers if needed

### Testing Strategy
- **Mock Repositories**: Used in tests for isolation and speed
- **MongoDB Repositories**: Used in production for persistence
- **Test Helpers**: `createTestApp()` provides fresh instances for each test
- **Validation**: Comprehensive input validation and error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the architecture patterns
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Ensure all tests pass
7. Submit a pull request

## License

MIT License 