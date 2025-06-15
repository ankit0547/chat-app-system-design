# WebSocket System Design for Real-Time Chat Application

## System Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Client 1   │◄───►│  WebSocket  │◄───►│  MongoDB    │
│             │     │  Server 1   │     │  Cluster    │
└─────────────┘     └─────────────┘     └─────────────┘
                           ▲
┌─────────────┐            │            ┌─────────────┐
│             │            │            │             │
│  Client 2   │◄───────────┘            │  Redis      │
│             │            ▲            │  Cluster    │
└─────────────┘            │            └─────────────┘
                           │                  ▲
┌─────────────┐            │                  │
│             │            │                  │
│  Client N   │◄───────────┘                  │
│             │                               │
└─────────────┘                               │
                    ┌─────────────┐           │
                    │             │           │
                    │  WebSocket  │◄──────────┘
                    │  Server 2   │
                    └─────────────┘
```

## 1. Core Components

### 1.1 WebSocket Server (Node.js)

- **Technology**: Node.js with `ws` or `socket.io` library
- **Responsibilities**:
  - Maintain persistent connections with clients
  - Handle connection/disconnection events
  - Process incoming messages
  - Broadcast messages to appropriate recipients
  - Implement authentication and authorization
  - Track user presence (online/offline status)
  - Handle reconnection logic

### 1.2 Database Layer (MongoDB)

- **Collections**:
  - `users`: User profiles and authentication data
  - `conversations`: Metadata about 1:1 and group conversations
  - `messages`: Actual message content with references to conversations
  - `presence`: User online/offline status (optional, can be in Redis instead)

- **Sharding Strategy**:
  - Shard `messages` collection by `conversation_id`
  - Shard `conversations` collection by `_id`
  - Keep `users` collection replicated across all shards

### 1.3 Caching and Pub/Sub Layer (Redis)

- **Caching**:
  - User sessions and authentication tokens
  - Conversation metadata
  - Recent messages for quick access

- **Pub/Sub Channels**:
  - `conversation:{id}`: For message delivery to specific conversations
  - `user:{id}`: For direct notifications to specific users
  - `presence`: For broadcasting online/offline status updates

## 2. Detailed Component Design

### 2.1 Connection Management

```typescript
// Connection management pseudocode
class ConnectionManager {
  private connections: Map<string, WebSocket> = new Map();
  
  addConnection(userId: string, socket: WebSocket): void {
    this.connections.set(userId, socket);
    this.publishPresence(userId, 'online');
  }
  
  removeConnection(userId: string): void {
    this.connections.delete(userId);
    this.publishPresence(userId, 'offline');
  }
  
  getConnection(userId: string): WebSocket | undefined {
    return this.connections.get(userId);
  }
  
  publishPresence(userId: string, status: 'online' | 'offline'): void {
    // Publish to Redis presence channel
    redisClient.publish('presence', JSON.stringify({ userId, status }));
  }
}
```

### 2.2 Message Processing Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Message    │     │  Validate   │     │  Persist    │     │  Publish    │
│  Received   │────►│  Message    │────►│  to MongoDB │────►│  to Redis   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Send       │     │  Delivery   │     │  Receive    │     │  Subscribe  │
│  to Client  │◄────│  Receipts   │◄────│  from Redis │◄────│  to Channel │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 2.3 Data Models

#### User Schema
```typescript
interface User {
  _id: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Conversation Schema
```typescript
interface Conversation {
  _id: ObjectId;
  type: 'direct' | 'group';
  participants: ObjectId[];  // User IDs
  createdBy: ObjectId;       // User ID
  name?: string;             // For group chats
  avatar?: string;           // For group chats
  lastMessage?: {
    content: string;
    sender: ObjectId;
    sentAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Message Schema
```typescript
interface Message {
  _id: ObjectId;
  conversationId: ObjectId;
  sender: ObjectId;          // User ID
  content: string;
  contentType: 'text' | 'image' | 'file' | 'location';
  attachments?: {
    url: string;
    type: string;
    name?: string;
    size?: number;
  }[];
  readBy: {
    userId: ObjectId;
    readAt: Date;
  }[];
  deliveredTo: {
    userId: ObjectId;
    deliveredAt: Date;
  }[];
  sentAt: Date;
  updatedAt?: Date;
}
```

## 3. Key Processes

### 3.1 Authentication Flow

1. Client connects to WebSocket server with JWT token
2. Server validates token and establishes authenticated connection
3. Server associates WebSocket connection with user ID
4. Server publishes user's online status to presence channel
5. Server subscribes to user's personal channel for direct notifications

```typescript
// Authentication pseudocode
async function authenticateConnection(socket: WebSocket, token: string): Promise<boolean> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub;
    
    // Validate user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return false;
    }
    
    // Associate socket with user
    socket.userId = userId;
    connectionManager.addConnection(userId, socket);
    
    // Subscribe to relevant Redis channels
    subscribeToUserChannels(userId);
    
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}
```

### 3.2 Message Delivery Flow

1. Client sends message to WebSocket server
2. Server validates message format and user permissions
3. Server persists message to MongoDB
4. Server publishes message to conversation channel in Redis
5. Other WebSocket servers receive message from Redis
6. Servers deliver message to connected participants
7. Clients acknowledge receipt
8. Server updates message delivery status in MongoDB

```typescript
// Message sending pseudocode
async function handleIncomingMessage(socket: WebSocket, message: any): Promise<void> {
  try {
    const userId = socket.userId;
    const { conversationId, content, contentType } = message;
    
    // Validate user is part of conversation
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(userId)
    });
    
    if (!conversation) {
      socket.send(JSON.stringify({
        type: 'error',
        code: 'UNAUTHORIZED',
        message: 'Not authorized to send messages to this conversation'
      }));
      return;
    }
    
    // Create message document
    const newMessage = {
      conversationId: new ObjectId(conversationId),
      sender: new ObjectId(userId),
      content,
      contentType,
      readBy: [],
      deliveredTo: [{
        userId: new ObjectId(userId),
        deliveredAt: new Date()
      }],
      sentAt: new Date()
    };
    
    // Persist to database
    const result = await db.collection('messages').insertOne(newMessage);
    
    // Update conversation's last message
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $set: { 
          lastMessage: {
            content,
            sender: new ObjectId(userId),
            sentAt: new Date()
          },
          updatedAt: new Date()
        } 
      }
    );
    
    // Publish to Redis
    redisClient.publish(`conversation:${conversationId}`, JSON.stringify({
      type: 'new_message',
      message: {
        ...newMessage,
        _id: result.insertedId
      }
    }));
    
    // Acknowledge to sender
    socket.send(JSON.stringify({
      type: 'message_sent',
      messageId: result.insertedId,
      conversationId
    }));
    
  } catch (error) {
    console.error('Error handling message:', error);
    socket.send(JSON.stringify({
      type: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Failed to process message'
    }));
  }
}
```

### 3.3 Presence Management

1. User connects/disconnects from WebSocket server
2. Server publishes presence update to Redis
3. All servers receive presence update
4. Servers notify relevant clients about status change
5. Presence information is cached in Redis with TTL

```typescript
// Presence management pseudocode
function handlePresenceUpdate(data: { userId: string, status: 'online' | 'offline' }): void {
  // Update presence in Redis
  if (data.status === 'online') {
    redisClient.set(`presence:${data.userId}`, 'online', 'EX', 300); // 5 minutes TTL
  } else {
    redisClient.set(`presence:${data.userId}`, 'offline');
  }
  
  // Find conversations involving this user
  db.collection('conversations').find({
    participants: new ObjectId(data.userId)
  }).toArray().then(conversations => {
    // Notify other participants in these conversations
    conversations.forEach(conversation => {
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== data.userId) {
          const socket = connectionManager.getConnection(participantId.toString());
          if (socket) {
            socket.send(JSON.stringify({
              type: 'presence_update',
              userId: data.userId,
              status: data.status
            }));
          }
        }
      });
    });
  });
}
```

## 4. Scalability and Fault Tolerance

### 4.1 Horizontal Scaling

- **WebSocket Servers**:
  - Deploy multiple instances behind a load balancer
  - Use sticky sessions to maintain connection affinity
  - Scale based on connection count and CPU usage

- **MongoDB**:
  - Implement sharding for `messages` collection based on `conversationId`
  - Use replica sets for high availability
  - Consider time-based sharding for historical messages

- **Redis**:
  - Use Redis Cluster for pub/sub scalability
  - Consider Redis Sentinel for high availability
  - Implement client-side partitioning for presence data

### 4.2 Fault Tolerance

- **Connection Recovery**:
  - Implement exponential backoff for client reconnection
  - Maintain message queue for offline clients
  - Track last seen message ID for each client

- **Data Durability**:
  - Ensure MongoDB write concern is set to majority
  - Implement write-ahead logging for critical operations
  - Use transactions for operations that span multiple collections

- **Service Resilience**:
  - Implement circuit breakers for external dependencies
  - Use health checks for service discovery
  - Implement graceful degradation for non-critical features

```typescript
// Reconnection handling pseudocode
function handleReconnection(socket: WebSocket, userId: string, lastMessageId: string): void {
  // Mark user as online
  connectionManager.addConnection(userId, socket);
  
  // Fetch missed messages
  db.collection('messages').find({
    conversationId: { $in: userConversationIds },
    _id: { $gt: new ObjectId(lastMessageId) }
  }).sort({ sentAt: 1 }).toArray().then(messages => {
    // Send missed messages to client
    messages.forEach(message => {
      socket.send(JSON.stringify({
        type: 'message',
        message
      }));
    });
    
    // Mark messages as delivered
    const messageIds = messages.map(m => m._id);
    if (messageIds.length > 0) {
      db.collection('messages').updateMany(
        { _id: { $in: messageIds } },
        { 
          $push: { 
            deliveredTo: {
              userId: new ObjectId(userId),
              deliveredAt: new Date()
            }
          }
        }
      );
    }
  });
}
```

## 5. Performance Optimizations

### 5.1 Connection Pooling

- Maintain persistent connections to MongoDB and Redis
- Implement connection pooling with appropriate sizing
- Monitor connection health and implement automatic recovery

### 5.2 Message Batching

- Batch database operations for message status updates
- Implement bulk read receipts processing
- Use MongoDB bulk write operations for efficiency

### 5.3 Caching Strategy

- Cache conversation metadata in Redis
- Cache recent messages (last 50) per conversation
- Implement LRU eviction policy for cache management

```typescript
// Caching pseudocode
async function getConversationWithRecentMessages(conversationId: string): Promise<any> {
  // Try to get from cache first
  const cachedData = await redisClient.get(`conversation:${conversationId}:data`);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  // If not in cache, fetch from database
  const conversation = await db.collection('conversations').findOne({
    _id: new ObjectId(conversationId)
  });
  
  const recentMessages = await db.collection('messages')
    .find({ conversationId: new ObjectId(conversationId) })
    .sort({ sentAt: -1 })
    .limit(50)
    .toArray();
  
  const result = {
    conversation,
    messages: recentMessages.reverse()
  };
  
  // Cache the result
  await redisClient.set(
    `conversation:${conversationId}:data`, 
    JSON.stringify(result),
    'EX',
    300 // 5 minutes TTL
  );
  
  return result;
}
```

## 6. Security Considerations

### 6.1 Authentication and Authorization

- Use JWT for authentication with short expiration times
- Implement refresh token rotation
- Validate user permissions for each conversation
- Sanitize and validate all user input

### 6.2 Rate Limiting

- Implement per-user rate limiting for message sending
- Use token bucket algorithm for rate limiting
- Apply more strict limits for group messages

### 6.3 Data Protection

- Encrypt sensitive data at rest
- Implement TLS for all WebSocket connections
- Consider end-to-end encryption for message content
- Implement proper access controls in MongoDB

```typescript
// Rate limiting pseudocode
class RateLimiter {
  private limits: Map<string, { count: number, resetAt: number }> = new Map();
  private readonly MAX_MESSAGES_PER_MINUTE = 60;
  
  canSendMessage(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.limits.get(userId);
    
    if (!userLimit || userLimit.resetAt < now) {
      // Reset or initialize rate limit
      this.limits.set(userId, { count: 1, resetAt: now + 60000 });
      return true;
    }
    
    if (userLimit.count >= this.MAX_MESSAGES_PER_MINUTE) {
      return false;
    }
    
    // Increment count
    userLimit.count += 1;
    this.limits.set(userId, userLimit);
    return true;
  }
}
```

## 7. Monitoring and Observability

### 7.1 Key Metrics

- **Connection Metrics**:
  - Active connections per server
  - Connection establishment rate
  - Connection error rate
  - WebSocket ping/pong latency

- **Message Metrics**:
  - Messages processed per second
  - Message delivery latency
  - Failed message deliveries
  - Message size distribution

- **System Metrics**:
  - CPU and memory usage
  - Network I/O
  - MongoDB operation latency
  - Redis pub/sub throughput

### 7.2 Logging Strategy

- Implement structured logging with correlation IDs
- Log all authentication events
- Sample message processing logs in production
- Implement different log levels for development and production

### 7.3 Alerting

- Set up alerts for abnormal connection drops
- Monitor message delivery success rate
- Alert on database performance degradation
- Implement SLO-based alerting for message delivery latency

## 8. Implementation Plan

### Phase 1: Core Functionality
- Implement basic WebSocket server with connection management
- Set up MongoDB schema and basic CRUD operations
- Implement authentication flow
- Build basic message sending and receiving

### Phase 2: Scalability Features
- Integrate Redis for pub/sub
- Implement presence management
- Add support for offline message delivery
- Implement read receipts and typing indicators

### Phase 3: Performance and Reliability
- Add connection recovery mechanisms
- Implement caching strategy
- Add monitoring and observability
- Optimize database queries and indexes

### Phase 4: Advanced Features
- Add support for file attachments
- Implement message editing and deletion
- Add group chat management features
- Implement message search functionality