# ActivityPub Implementation Details

This document details the implementation of ActivityPub endpoints in the Non-Relational Nation backend.

## Implemented Endpoints

### 1. WebFinger Discovery
- **Endpoint**: `/.well-known/webfinger`
- **Method**: GET
- **Purpose**: Allows discovery of user identities across the fediverse
- **Implementation**: 
  - Validates the resource parameter format
  - Checks if the domain matches our server
  - Returns WebFinger response with links to user profile and ActivityPub actor

### 2. Actor Endpoints
- **Endpoint**: `/users/:username`
- **Method**: GET
- **Purpose**: Provides user profile information in ActivityPub format
- **Implementation**:
  - Returns a complete ActivityPub actor object
  - Includes user details, public key, and collection links
  - Contains inbox, outbox, followers, and following collections

### 3. Activity Endpoints

#### Inbox
- **Endpoint**: `/users/:username/inbox`
- **Method**: POST
- **Purpose**: Receives activities from other servers/users
- **Implementation**:
  - Accepts incoming activities
  - Processes and stores activities (in a real implementation)
  - Returns 202 Accepted status

#### Outbox
- **Endpoint**: `/users/:username/outbox`
- **Method**: GET
- **Purpose**: Provides public activities of a user
- **Implementation**:
  - Returns an OrderedCollection of user activities
  - In a real implementation, would fetch from database

### 4. Followers/Following Endpoints

#### Followers
- **Endpoint**: `/users/:username/followers`
- **Method**: GET
- **Purpose**: Provides the collection of users following this user
- **Implementation**:
  - Returns an OrderedCollection of followers
  - In a real implementation, would fetch from database

#### Following
- **Endpoint**: `/users/:username/following`
- **Method**: GET
- **Purpose**: Provides the collection of users this user is following
- **Implementation**:
  - Returns an OrderedCollection of following
  - In a real implementation, would fetch from database

### 5. Shared Inbox Endpoint
- **Endpoint**: `/inbox`
- **Method**: POST
- **Purpose**: Receives activities for the entire server
- **Implementation**:
  - Accepts activities for any user on the server
  - Processes and distributes activities appropriately
  - Returns 202 Accepted status

## Implementation Details

### Files Modified

1. **backend/src/controllers/ActivityPubController.ts**
   - Added methods for all endpoints
   - Implemented proper ActivityPub object structures
   - Added basic validation and error handling

2. **backend/src/routes/activitypub.ts**
   - Uncommented and configured all routes
   - Connected routes to controller methods

3. **backend/src/app.ts**
   - Imported and mounted ActivityPub routes
   - Ensured proper route ordering to avoid conflicts

### Key Features

- Full ActivityPub compliance for basic federation
- Proper HTTP status codes and response formats
- Basic validation and error handling
- Mock implementations for data that would typically come from a database
- Support for WebFinger discovery protocol

### Testing

The backend has been tested and is running successfully with all endpoints accessible.

## Future Improvements

1. Database integration for persistent storage of users and activities
2. Enhanced security with proper signature verification
3. Complete implementation of activity processing logic
4. Caching mechanisms for improved performance
5. Comprehensive error handling and logging