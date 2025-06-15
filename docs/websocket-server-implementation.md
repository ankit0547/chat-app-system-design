# WebSocket Server Implementation Guide

This document provides a detailed implementation guide for the WebSocket server component of our real-time chat application.

## 1. Server Setup

### 1.1 Basic Server Structure

```typescript
// server.ts
import * as http from 'http';
import { WebSocketServer } from 'ws';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { verify } from 'jsonwebtoken';

// Configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Database connection
let db: any;
MongoClient.connect(MONGODB_URI).then(client => {
  console.log('Connected to MongoDB');
  db = client.db();
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Redis clients
const redisPublisher = createClient({ url: REDIS_URI });
const redisSubscriber = createClient({ url: REDIS_URI });

Promise.all([
  redisPublisher.connect(),
  redisSubscriber.connect()
]).then(() => {
  console.log('Connected to Redis');
}).catch(err => {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
});

// Start server
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
```

### 1.2 Connection Manager

```typescript
// connectionManager.ts
import { WebSocket } from 'ws';
import { RedisClientType } from 'redis';

export class ConnectionManager {
  private connections: Map<string, WebSocket> = new Map();
  private redisPublisher: RedisClientType;
  
  constructor(redisPublisher: RedisClientType) {
    this.redisPublisher = redisPublisher;
  }
  
  addConnection(userId: string, socket: WebSocket): void {
    // Remove any existing connection for this user
    this.removeConnection(userId);
    
    // Add new connection
    this.connections.set(userId, socket);
    
    // Update presence
    this.updatePresence(userId, 'online');
    
    console.log(`User ${userId} connected. Total connections: ${this.connections.size}`);
  }
  
  removeConnection(userId: string): void {
    const existingSocket = this.connections.get(userId);
    if (existingSocket) {
      // Close existing socket if it's still open
      if (existingSocket.readyState === WebSocket.OPEN) {
        existingSocket.close();
      }
      
      // Remove from connections map
      this.connections.delete(userId);
      
      // Update presence
      this.updatePresence(userId, 'offline');
      
      console.log(`User ${userId} disconnected. Total connections: ${this.connections.size}`);
    }
  }
  
  getConnection(userId: string): WebSocket | undefined {
    return this.connections.get(userId);
  }
  
  async updatePresence(userId: string, status: 'online' | 'offline'): Promise<void> {
    try {
      // Publish presence update to Redis
      await this.redisPublisher.publish('presence', JSON.stringify({
        userId,
        status,
        timestamp: Date.now()
      }));
      
      // Store presence in Redis
      if (status === 'online') {
        await this.redisPublisher.set(`presence:${userId}`, 'online', {
          EX: 300 // 5 minutes TTL
        });
      } else {
        await this.redisPublisher.set(`presence:${userId}`, 'offline');
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }
  
  broadcastToUsers(userIds: string[], message: any): void {
    const messageStr = JSON.stringify(message);
    
    userIds.forEach(userId => {
      const socket = this.connections.get(userId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
      }
    });
  }
  
  getConnectionCount(): number {
    return this.connections.size;
  }
}
```

## 2. Authentication and Connection Handling

### 2.1 Authentication Middleware

```typescript
// auth.ts
import { WebSocket } from 'ws';
import { verify, JwtPayload } from 'jsonwebtoken';
import { Db } from 'mongodb';
import { ObjectId } from 'mongodb';

export interface AuthenticatedSocket extends WebSocket {
  userId: string;
  isAuthenticated: boolean;
}

export async function authenticateConnection(
  socket: AuthenticatedSocket,
  token: string,
  db: Db,
  jwtSecret: string
): Promise<boolean> {
  try {
    // Verify JWT token
    const decoded = verify(token, jwtSecret) as JwtPayload;
    const userId = decoded.sub;
    
    if (!userId) {
      return false;
    }
    
    // Validate user exists in database
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userId as string) 
    });
    
    if (!user) {
      return false;
    }
    
    // Mark socket as authenticated
    socket.userId = userId as string;
    socket.isAuthenticated = true;
    
    // Update user's last seen timestamp
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId as string) },
      { $set: { lastSeen: new Date() } }
    );
    
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}
```

### 2.2 Connection Handler

```typescript
// connectionHandler.ts
import { WebSocketServer } from 'ws';
import { Db } from 'mongodb';
import { RedisClientType } from 'redis';
import { ConnectionManager } from './connectionManager';
import { authenticateConnection, AuthenticatedSocket } from './auth';
import { MessageHandler } from './messageHandler';

export function setupConnectionHandling(
  wss: WebSocketServer,
  db: Db,
  redisPublisher: RedisClientType,
  redisSubscriber: RedisClientType,
  jwtSecret: string
): void {
  const connectionManager = new ConnectionManager(redisPublisher);
  const messageHandler = new MessageHandler(db, connectionManager, redisPublisher);
  
  wss.on('connection', async (socket: AuthenticatedSocket, request) => {
    console.log('New connection attempt');
    
    // Extract token from query string
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      socket.close(1008, 'Authentication required');
      return;
    }
    
    // Authenticate the connection
    const isAuthenticated = await authenticateConnection(socket, token, db, jwtSecret);
    
    if (!isAuthenticated) {
      socket.close(1008, 'Authentication failed');
      return;
    }
    
    // Register the authenticated connection
    connectionManager.addConnection(socket.userId, socket);
    
    // Subscribe to user's personal channel
    await redisSubscriber.subscribe(`user:${socket.userId}`, (message) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(message);
      }
    });
    
    // Handle incoming messages
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        messageHandler.handleMessage(socket, message);
      } catch (error) {
        console.error('Error parsing message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          code: 'INVALID_FORMAT',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      // Unsubscribe from user's channel
      redisSubscriber.unsubscribe(`user:${socket.userId}`);
      
      // Remove connection
      connectionManager.removeConnection(socket.userId);
    });
    
    // Send initial data to client
    socket.send(JSON.stringify({
      type: 'connection_established',
      userId: socket.userId
    }));
  });
  
  // Subscribe to presence channel
  redisSubscriber.subscribe('presence', (message) => {
    try {
      const presenceUpdate = JSON.parse(message);
      handlePresenceUpdate(presenceUpdate, connectionManager);
    } catch (error) {
      console.error('Error handling presence update:', error);
    }
  });
}

async function handlePresenceUpdate(
  data: { userId: string, status: 'online' | 'offline', timestamp: number },
  connectionManager: ConnectionManager
): Promise<void> {
  // Broadcast presence update to relevant users
  // This would typically involve finding all conversations the user is part of
  // and notifying other participants
  
  // For simplicity, we're not implementing the full logic here
  console.log(`Presence update: User ${data.userId} is ${data.status}`);
}
```

## 3. Message Handling

### 3.1 Message Handler

```typescript
// messageHandler.ts
import { WebSocket } from 'ws';
import { Db, ObjectId } from 'mongodb';
import { RedisClientType } from 'redis';
import { ConnectionManager } from './connectionManager';
import { AuthenticatedSocket } from './auth';

export class MessageHandler {
  private db: Db;
  private connectionManager: ConnectionManager;
  private redisPublisher: RedisClientType;
  private rateLimiter: RateLimiter;
  
  constructor(
    db: Db, 
    connectionManager: ConnectionManager,
    redisPublisher: RedisClientType
  ) {
    this.db = db;
    this.connectionManager = connectionManager;
    this.redisPublisher = redisPublisher;
    this.rateLimiter = new RateLimiter();
  }
  
  async handleMessage(socket: AuthenticatedSocket, message: any): Promise<void> {
    // Check if socket is authenticated
    if (!socket.isAuthenticated) {
      socket.send(JSON.stringify({
        type: 'error',
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }));
      return;
    }
    
    // Apply rate limiting
    if (!this.rateLimiter.canSendMessage(socket.userId)) {
      socket.send(JSON.stringify({
        type: 'error',
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded. Please try again later.'
      }));
      return;
    }
    
    // Handle different message types
    switch (message.type) {
      case 'send_message':
        await this.handleSendMessage(socket, message);
        break;
        
      case 'read_receipt':
        await this.handleReadReceipt(socket, message);
        break;
        
      case 'typing_indicator':
        await this.handleTypingIndicator(socket, message);
        break;
        
      default:
        socket.send(JSON.stringify({
          type: 'error',
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: 'Unknown message type'
        }));
    }
  }
  
  private async handleSendMessage(socket: AuthenticatedSocket, message: any): Promise<void> {
    try {
      const { conversationId, content, contentType = 'text' } = message;
      
      if (!conversationId || !content) {
        socket.send(JSON.stringify({
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Missing required fields'
        }));
        return;
      }
      
      // Validate user is part of conversation
      const conversation = await this.db.collection('conversations').findOne({
        _id: new ObjectId(conversationId),
        participants: new ObjectId(socket.userId)
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
        sender: new ObjectId(socket.userId),
        content,
        contentType,
        readBy: [],
        deliveredTo: [{
          userId: new ObjectId(socket.userId),
          deliveredAt: new Date()
        }],
        sentAt: new Date()
      };
      
      // Persist to database
      const result = await this.db.collection('messages').insertOne(newMessage);
      
      // Update conversation's last message
      await this.db.collection('conversations').updateOne(
        { _id: new ObjectId(conversationId) },
        { 
          $set: { 
            lastMessage: {
              content,
              sender: new ObjectId(socket.userId),
              sentAt: new Date()
            },
            updatedAt: new Date()
          } 
        }
      );
      
      // Prepare message for publishing
      const messageToPublish = {
        ...newMessage,
        _id: result.insertedId,
        sender: socket.userId // Convert ObjectId to string for simplicity
      };
      
      // Publish to Redis
      await this.redisPublisher.publish(
        `conversation:${conversationId}`, 
        JSON.stringify({
          type: 'new_message',
          message: messageToPublish
        })
      );
      
      // Acknowledge to sender
      socket.send(JSON.stringify({
        type: 'message_sent',
        messageId: result.insertedId.toString(),
        conversationId
      }));
      
      // Deliver to online participants
      this.deliverMessageToParticipants(conversation, messageToPublish);
      
    } catch (error) {
      console.error('Error handling send message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to process message'
      }));
    }
  }
  
  private async handleReadReceipt(socket: AuthenticatedSocket, message: any): Promise<void> {
    try {
      const { messageId } = message;
      
      if (!messageId) {
        socket.send(JSON.stringify({
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Missing messageId'
        }));
        return;
      }
      
      // Update message read status
      const result = await this.db.collection('messages').updateOne(
        { 
          _id: new ObjectId(messageId),
          'readBy.userId': { $ne: new ObjectId(socket.userId) }
        },
        {
          $push: {
            readBy: {
              userId: new ObjectId(socket.userId),
              readAt: new Date()
            }
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        // Message already marked as read or doesn't exist
        return;
      }
      
      // Get the message to find conversation and sender
      const message = await this.db.collection('messages').findOne({
        _id: new ObjectId(messageId)
      });
      
      if (!message) {
        return;
      }
      
      // Publish read receipt to conversation channel
      await this.redisPublisher.publish(
        `conversation:${message.conversationId}`,
        JSON.stringify({
          type: 'read_receipt',
          messageId,
          userId: socket.userId,
          readAt: new Date()
        })
      );
      
    } catch (error) {
      console.error('Error handling read receipt:', error);
    }
  }
  
  private async handleTypingIndicator(socket: AuthenticatedSocket, message: any): Promise<void> {
    try {
      const { conversationId, isTyping } = message;
      
      if (!conversationId || isTyping === undefined) {
        socket.send(JSON.stringify({
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Missing required fields'
        }));
        return;
      }
      
      // Validate user is part of conversation
      const conversation = await this.db.collection('conversations').findOne({
        _id: new ObjectId(conversationId),
        participants: new ObjectId(socket.userId)
      });
      
      if (!conversation) {
        socket.send(JSON.stringify({
          type: 'error',
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this conversation'
        }));
        return;
      }
      
      // Publish typing indicator to conversation channel
      await this.redisPublisher.publish(
        `conversation:${conversationId}`,
        JSON.stringify({
          type: 'typing_indicator',
          userId: socket.userId,
          isTyping,
          timestamp: Date.now()
        })
      );
      
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  }
  
  private deliverMessageToParticipants(conversation: any, message: any): void {
    // Convert participant ObjectIds to strings
    const participantIds = conversation.participants.map((p: ObjectId) => p.toString());
    
    // Filter out the sender
    const recipientIds = participantIds.filter(id => id !== message.sender);
    
    // Prepare message notification
    const notification = {
      type: 'new_message',
      message
    };
    
    // Broadcast to online recipients
    this.connectionManager.broadcastToUsers(recipientIds, notification);
    
    // Mark as delivered for online recipients
    this.markMessageAsDelivered(message._id.toString(), recipientIds);
  }
  
  private async markMessageAsDelivered(messageId: string, userIds: string[]): Promise<void> {
    try {
      const deliveryUpdates = userIds.map(userId => ({
        userId: new ObjectId(userId),
        deliveredAt: new Date()
      }));
      
      await this.db.collection('messages').updateOne(
        { _id: new ObjectId(messageId) },
        { $push: { deliveredTo: { $each: deliveryUpdates } } }
      );
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  }
}

// Simple rate limiter implementation
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

## 4. Redis Pub/Sub Integration

### 4.1 Message Subscription Handler

```typescript
// subscriptionHandler.ts
import { RedisClientType } from 'redis';
import { ConnectionManager } from './connectionManager';
import { Db, ObjectId } from 'mongodb';

export async function setupSubscriptions(
  redisSubscriber: RedisClientType,
  connectionManager: ConnectionManager,
  db: Db
): Promise<void> {
  // Subscribe to presence channel
  await redisSubscriber.subscribe('presence', (message) => {
    try {
      const data = JSON.parse(message);
      handlePresenceUpdate(data, connectionManager, db);
    } catch (error) {
      console.error('Error handling presence update:', error);
    }
  });
  
  // Subscribe to conversation channels based on active users
  // This would typically be done dynamically as users connect
  // For simplicity, we're not implementing the full logic here
}

async function handlePresenceUpdate(
  data: { userId: string, status: 'online' | 'offline', timestamp: number },
  connectionManager: ConnectionManager,
  db: Db
): Promise<void> {
  try {
    // Find conversations involving this user
    const conversations = await db.collection('conversations').find({
      participants: new ObjectId(data.userId)
    }).toArray();
    
    // Notify other participants in these conversations
    for (const conversation of conversations) {
      const participantIds = conversation.participants
        .map((p: ObjectId) => p.toString())
        .filter((id: string) => id !== data.userId);
      
      // Broadcast presence update to online participants
      connectionManager.broadcastToUsers(participantIds, {
        type: 'presence_update',
        userId: data.userId,
        status: data.status,
        timestamp: data.timestamp
      });
    }
    
    // Update user's last seen timestamp in database if going offline
    if (data.status === 'offline') {
      await db.collection('users').updateOne(
        { _id: new ObjectId(data.userId) },
        { $set: { lastSeen: new Date(data.timestamp) } }
      );
    }
  } catch (error) {
    console.error('Error processing presence update:', error);
  }
}

export async function subscribeToConversation(
  redisSubscriber: RedisClientType,
  conversationId: string,
  connectionManager: ConnectionManager,
  db: Db
): Promise<void> {
  await redisSubscriber.subscribe(`conversation:${conversationId}`, async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'new_message':
          await handleNewMessage(data.message, connectionManager, db);
          break;
          
        case 'read_receipt':
          await handleReadReceipt(data, connectionManager);
          break;
          
        case 'typing_indicator':
          await handleTypingIndicator(data, connectionManager);
          break;
      }
    } catch (error) {
      console.error(`Error handling message for conversation ${conversationId}:`, error);
    }
  });
}

async function handleNewMessage(
  message: any,
  connectionManager: ConnectionManager,
  db: Db
): Promise<void> {
  try {
    // Get conversation to find participants
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(message.conversationId)
    });
    
    if (!conversation) {
      return;
    }
    
    // Convert participant ObjectIds to strings
    const participantIds = conversation.participants.map((p: ObjectId) => p.toString());
    
    // Filter out the sender
    const recipientIds = participantIds.filter(id => id !== message.sender);
    
    // Broadcast to online recipients
    connectionManager.broadcastToUsers(recipientIds, {
      type: 'new_message',
      message
    });
    
    // Mark as delivered for online recipients
    await markMessageAsDelivered(message._id, recipientIds, db);
  } catch (error) {
    console.error('Error handling new message:', error);
  }
}

async function handleReadReceipt(
  data: { messageId: string, userId: string, readAt: Date },
  connectionManager: ConnectionManager
): Promise<void> {
  try {
    // This would typically involve notifying the message sender
    // that their message has been read
    // For simplicity, we're broadcasting to all connected users
    connectionManager.broadcastToUsers([data.userId], {
      type: 'read_receipt',
      messageId: data.messageId,
      userId: data.userId,
      readAt: data.readAt
    });
  } catch (error) {
    console.error('Error handling read receipt:', error);
  }
}

async function handleTypingIndicator(
  data: { userId: string, isTyping: boolean, timestamp: number },
  connectionManager: ConnectionManager
): Promise<void> {
  try {
    // This would typically involve notifying all participants in the conversation
    // For simplicity, we're broadcasting to all connected users
    connectionManager.broadcastToUsers([data.userId], {
      type: 'typing_indicator',
      userId: data.userId,
      isTyping: data.isTyping,
      timestamp: data.timestamp
    });
  } catch (error) {
    console.error('Error handling typing indicator:', error);
  }
}

async function markMessageAsDelivered(
  messageId: string | ObjectId,
  userIds: string[],
  db: Db
): Promise<void> {
  try {
    const deliveryUpdates = userIds.map(userId => ({
      userId: new ObjectId(userId),
      deliveredAt: new Date()
    }));
    
    await db.collection('messages').updateOne(
      { _id: new ObjectId(messageId.toString()) },
      { $push: { deliveredTo: { $each: deliveryUpdates } } }
    );
  } catch (error) {
    console.error('Error marking message as delivered:', error);
  }
}
```

## 5. Health Monitoring and Metrics

### 5.1 Health Check Endpoint

```typescript
// healthCheck.ts
import * as http from 'http';
import { WebSocketServer } from 'ws';
import { MongoClient } from 'mongodb';
import { RedisClientType } from 'redis';
import { ConnectionManager } from './connectionManager';

export function setupHealthCheck(
  server: http.Server,
  wss: WebSocketServer,
  mongoClient: MongoClient,
  redisPublisher: RedisClientType,
  redisSubscriber: RedisClientType,
  connectionManager: ConnectionManager
): void {
  // Create a simple HTTP endpoint for health checks
  server.on('request', (req, res) => {
    if (req.url === '/health') {
      const health = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        websocket: {
          status: wss.clients.size > 0 ? 'UP' : 'DEGRADED',
          connections: wss.clients.size
        },
        mongodb: {
          status: mongoClient.topology?.isConnected() ? 'UP' : 'DOWN'
        },
        redis: {
          publisher: redisPublisher.isOpen ? 'UP' : 'DOWN',
          subscriber: redisSubscriber.isOpen ? 'UP' : 'DOWN'
        },
        activeConnections: connectionManager.getConnectionCount()
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify(health, null, 2));
    }
  });
}
```

### 5.2 Metrics Collection

```typescript
// metrics.ts
import { WebSocketServer } from 'ws';
import { ConnectionManager } from './connectionManager';

interface Metrics {
  connections: {
    total: number;
    history: Array<{ timestamp: number; count: number }>;
  };
  messages: {
    sent: number;
    delivered: number;
    read: number;
  };
  errors: {
    count: number;
    byType: Record<string, number>;
  };
  performance: {
    messageProcessingTime: number[];
  };
}

export class MetricsCollector {
  private metrics: Metrics = {
    connections: {
      total: 0,
      history: []
    },
    messages: {
      sent: 0,
      delivered: 0,
      read: 0
    },
    errors: {
      count: 0,
      byType: {}
    },
    performance: {
      messageProcessingTime: []
    }
  };
  
  private wss: WebSocketServer;
  private connectionManager: ConnectionManager;
  
  constructor(wss: WebSocketServer, connectionManager: ConnectionManager) {
    this.wss = wss;
    this.connectionManager = connectionManager;
    
    // Start periodic collection
    setInterval(() => this.collectConnectionMetrics(), 60000); // Every minute
  }
  
  private collectConnectionMetrics(): void {
    const count = this.connectionManager.getConnectionCount();
    
    this.metrics.connections.total = count;
    this.metrics.connections.history.push({
      timestamp: Date.now(),
      count
    });
    
    // Keep only the last 60 data points (1 hour at 1 minute intervals)
    if (this.metrics.connections.history.length > 60) {
      this.metrics.connections.history.shift();
    }
  }
  
  recordMessageSent(): void {
    this.metrics.messages.sent++;
  }
  
  recordMessageDelivered(): void {
    this.metrics.messages.delivered++;
  }
  
  recordMessageRead(): void {
    this.metrics.messages.read++;
  }
  
  recordError(type: string): void {
    this.metrics.errors.count++;
    this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1;
  }
  
  recordMessageProcessingTime(timeMs: number): void {
    this.metrics.performance.messageProcessingTime.push(timeMs);
    
    // Keep only the last 1000 measurements
    if (this.metrics.performance.messageProcessingTime.length > 1000) {
      this.metrics.performance.messageProcessingTime.shift();
    }
  }
  
  getMetrics(): Metrics {
    return { ...this.metrics };
  }
  
  getAverageMessageProcessingTime(): number {
    const times = this.metrics.performance.messageProcessingTime;
    if (times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }
}
```

## 6. Main Application

### 6.1 Putting It All Together

```typescript
// index.ts
import * as http from 'http';
import { WebSocketServer } from 'ws';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { ConnectionManager } from './connectionManager';
import { setupConnectionHandling } from './connectionHandler';
import { setupSubscriptions } from './subscriptionHandler';
import { setupHealthCheck } from './healthCheck';
import { MetricsCollector } from './metrics';

// Configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function startServer() {
  try {
    // Create HTTP server
    const server = http.createServer();
    
    // Create WebSocket server
    const wss = new WebSocketServer({ server });
    
    // Connect to MongoDB
    const mongoClient = await MongoClient.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const db = mongoClient.db();
    
    // Connect to Redis
    const redisPublisher = createClient({ url: REDIS_URI });
    const redisSubscriber = createClient({ url: REDIS_URI });
    
    await Promise.all([
      redisPublisher.connect(),
      redisSubscriber.connect()
    ]);
    console.log('Connected to Redis');
    
    // Create connection manager
    const connectionManager = new ConnectionManager(redisPublisher);
    
    // Setup metrics collector
    const metricsCollector = new MetricsCollector(wss, connectionManager);
    
    // Setup connection handling
    setupConnectionHandling(wss, db, redisPublisher, redisSubscriber, JWT_SECRET);
    
    // Setup Redis subscriptions
    await setupSubscriptions(redisSubscriber, connectionManager, db);
    
    // Setup health check endpoint
    setupHealthCheck(server, wss, mongoClient, redisPublisher, redisSubscriber, connectionManager);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`WebSocket server is running on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      
      // Close WebSocket server
      wss.close();
      
      // Close database connections
      await mongoClient.close();
      
      // Close Redis connections
      await Promise.all([
        redisPublisher.quit(),
        redisSubscriber.quit()
      ]);
      
      console.log('Server shutdown complete');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## 7. Client Integration

### 7.1 WebSocket Client

```typescript
// client.ts
export class ChatClient {
  private socket: WebSocket | null = null;
  private token: string;
  private serverUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private listeners: Map<string, Function[]> = new Map();
  private lastMessageId: string | null = null;
  
  constructor(serverUrl: string, token: string) {
    this.serverUrl = serverUrl;
    this.token = token;
  }
  
  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    const url = `${this.serverUrl}?token=${this.token}`;
    this.socket = new WebSocket(url);
    
    this.socket.onopen = () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected');
      
      // If we have a last message ID, send it to get missed messages
      if (this.lastMessageId) {
        this.socket?.send(JSON.stringify({
          type: 'sync',
          lastMessageId: this.lastMessageId
        }));
      }
    };
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Update last message ID if this is a new message
        if (message.type === 'new_message' && message.message?._id) {
          this.lastMessageId = message.message._id;
        }
        
        // Emit event based on message type
        this.emit(message.type, message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      this.emit('disconnected', { code: event.code, reason: event.reason });
      
      // Attempt to reconnect
      this.attemptReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      this.emit('reconnect_failed');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  sendMessage(conversationId: string, content: string, contentType: string = 'text'): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.emit('error', { message: 'Not connected to server' });
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'send_message',
      conversationId,
      content,
      contentType
    }));
  }
  
  sendReadReceipt(messageId: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'read_receipt',
      messageId
    }));
  }
  
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'typing_indicator',
      conversationId,
      isTyping
    }));
  }
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
  }
  
  off(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
  
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}
```

### 7.2 React Integration Example

```typescript
// ChatContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ChatClient } from './client';

interface ChatContextType {
  client: ChatClient | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => void;
  sendReadReceipt: (messageId: string) => void;
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType>({
  client: null,
  isConnected: false,
  sendMessage: () => {},
  sendReadReceipt: () => {},
  sendTypingIndicator: () => {}
});

export const useChatClient = () => useContext(ChatContext);

interface ChatProviderProps {
  children: ReactNode;
  serverUrl: string;
  token: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, serverUrl, token }) => {
  const [client, setClient] = useState<ChatClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Create chat client
    const chatClient = new ChatClient(serverUrl, token);
    
    // Set up event listeners
    chatClient.on('connected', () => {
      setIsConnected(true);
    });
    
    chatClient.on('disconnected', () => {
      setIsConnected(false);
    });
    
    // Connect to server
    chatClient.connect();
    
    // Set client in state
    setClient(chatClient);
    
    // Clean up on unmount
    return () => {
      chatClient.disconnect();
    };
  }, [serverUrl, token]);
  
  const sendMessage = (conversationId: string, content: string) => {
    client?.sendMessage(conversationId, content);
  };
  
  const sendReadReceipt = (messageId: string) => {
    client?.sendReadReceipt(messageId);
  };
  
  const sendTypingIndicator = (conversationId: string, isTyping: boolean) => {
    client?.sendTypingIndicator(conversationId, isTyping);
  };
  
  return (
    <ChatContext.Provider value={{ 
      client, 
      isConnected, 
      sendMessage, 
      sendReadReceipt, 
      sendTypingIndicator 
    }}>
      {children}
    </ChatContext.Provider>
  );
};
```

## 8. Deployment Considerations

### 8.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --production

# Copy application code
COPY dist/ ./dist/

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
```

### 8.2 Kubernetes Configuration

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-websocket-server
  labels:
    app: chat-websocket-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-websocket-server
  template:
    metadata:
      labels:
        app: chat-websocket-server
    spec:
      containers:
      - name: chat-websocket-server
        image: chat-websocket-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: mongodb-uri
        - name: REDIS_URI
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: redis-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: jwt-secret
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: chat-websocket-server
spec:
  selector:
    app: chat-websocket-server
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-websocket-server
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
    nginx.ingress.kubernetes.io/websocket-services: "chat-websocket-server"
spec:
  rules:
  - host: ws.chat-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: chat-websocket-server
            port:
              number: 80
```

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// messageHandler.test.ts
import { MessageHandler } from './messageHandler';
import { ConnectionManager } from './connectionManager';
import { MongoClient, Db } from 'mongodb';
import { createClient } from 'redis';
import { mock, instance, when, verify, anything } from 'ts-mockito';

describe('MessageHandler', () => {
  let mockDb: Db;
  let mockConnectionManager: ConnectionManager;
  let mockRedisPublisher: any;
  let messageHandler: MessageHandler;
  
  beforeEach(() => {
    mockDb = mock<Db>();
    mockConnectionManager = mock<ConnectionManager>();
    mockRedisPublisher = mock<any>();
    
    messageHandler = new MessageHandler(
      instance(mockDb),
      instance(mockConnectionManager),
      instance(mockRedisPublisher)
    );
  });
  
  test('handleMessage should reject unauthenticated requests', async () => {
    // Arrange
    const mockSocket: any = {
      isAuthenticated: false,
      send: jest.fn()
    };
    
    // Act
    await messageHandler.handleMessage(mockSocket, { type: 'send_message' });
    
    // Assert
    expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('UNAUTHORIZED'));
  });
  
  // Add more tests for different message types and scenarios
});
```

### 9.2 Integration Tests

```typescript
// integration.test.ts
import { WebSocket } from 'ws';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { startServer } from './index';

describe('WebSocket Server Integration Tests', () => {
  let mongoClient: MongoClient;
  let redisPublisher: any;
  let redisSubscriber: any;
  let serverProcess: any;
  
  beforeAll(async () => {
    // Start test database and Redis
    mongoClient = await MongoClient.connect('mongodb://localhost:27017/chat_test');
    redisPublisher = createClient({ url: 'redis://localhost:6379' });
    redisSubscriber = createClient({ url: 'redis://localhost:6379' });
    
    await Promise.all([
      redisPublisher.connect(),
      redisSubscriber.connect()
    ]);
    
    // Start server
    serverProcess = startServer({
      port: 3001,
      mongodbUri: 'mongodb://localhost:27017/chat_test',
      redisUri: 'redis://localhost:6379',
      jwtSecret: 'test_secret'
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  afterAll(async () => {
    // Clean up
    await mongoClient.db().dropDatabase();
    await mongoClient.close();
    await redisPublisher.quit();
    await redisSubscriber.quit();
    serverProcess.kill();
  });
  
  test('should connect with valid token', (done) => {
    // Create a valid token for testing
    const token = 'valid_test_token'; // In a real test, generate a proper JWT
    
    const client = new WebSocket(`ws://localhost:3001?token=${token}`);
    
    client.on('open', () => {
      expect(client.readyState).toBe(WebSocket.OPEN);
      client.close();
      done();
    });
    
    client.on('error', (error) => {
      done(error);
    });
  });
  
  // Add more integration tests for message sending, receiving, etc.
});
```

### 9.3 Load Testing

```typescript
// loadTest.js
import http from 'k6/http';
import { WebSocket } from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
};

export default function() {
  // Generate test token
  const token = 'test_token_' + __VU; // Virtual User ID
  
  // Connect to WebSocket server
  const url = `ws://localhost:3000?token=${token}`;
  const res = WebSocket.connect(url, null, function(socket) {
    socket.on('open', () => {
      console.log('Connected');
      
      // Send a message every 5 seconds
      const interval = setInterval(() => {
        socket.send(JSON.stringify({
          type: 'send_message',
          conversationId: 'test_conversation',
          content: 'Load test message from VU ' + __VU
        }));
      }, 5000);
      
      // Handle incoming messages
      socket.on('message', (msg) => {
        const data = JSON.parse(msg);
        if (data.type === 'message_sent') {
          console.log('Message sent confirmation received');
        }
      });
      
      // Close after 30 seconds
      setTimeout(() => {
        clearInterval(interval);
        socket.close();
      }, 30000);
    });
    
    socket.on('close', () => console.log('Disconnected'));
    socket.on('error', (e) => console.log('Error: ', e));
  });
  
  check(res, { 'Connected successfully': (r) => r && r.status === 101 });
  
  sleep(30);
}
```