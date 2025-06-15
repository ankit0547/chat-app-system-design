# Redis Implementation for Real-Time Chat System

This document outlines the Redis implementation strategy for our real-time chat application, focusing on pub/sub messaging, caching, and presence management.

## 1. Redis Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  WebSocket      │◄───►│  Redis          │◄───►│  WebSocket      │
│  Server 1       │     │  Cluster        │     │  Server 2       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                        ▲                      ▲
        │                        │                      │
        ▼                        │                      ▼
┌─────────────────┐              │              ┌─────────────────┐
│                 │              │              │                 │
│  Client         │              │              │  Client         │
│  Connections    │              │              │  Connections    │
│                 │              │              │                 │
└─────────────────┘              │              └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  MongoDB        │
                        │  Database       │
                        │                 │
                        └─────────────────┘
```

## 2. Redis Cluster Configuration

### 2.1 Cluster Setup

For high availability and scalability, we'll use a Redis Cluster with:
- 3 master nodes
- 3 replica nodes (1 replica per master)
- Sharding across masters for distributed data

```bash
# Example Redis Cluster configuration (redis.conf)
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```

### 2.2 Connection Management

```typescript
// redisManager.ts
import { createClient, RedisClientType } from 'redis';

export class RedisManager {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private cache: RedisClientType;
  
  constructor(redisUrl: string) {
    // Create separate clients for different purposes
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });
    this.cache = createClient({ url: redisUrl });
    
    // Set up error handling
    this.publisher.on('error', this.handleRedisError);
    this.subscriber.on('error', this.handleRedisError);
    this.cache.on('error', this.handleRedisError);
  }
  
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.connect(),
        this.subscriber.connect(),
        this.cache.connect()
      ]);
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.quit(),
        this.subscriber.quit(),
        this.cache.quit()
      ]);
      console.log('Disconnected from Redis');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
  
  getPublisher(): RedisClientType {
    return this.publisher;
  }
  
  getSubscriber(): RedisClientType {
    return this.subscriber;
  }
  
  getCache(): RedisClientType {
    return this.cache;
  }
  
  private handleRedisError(error: Error): void {
    console.error('Redis error:', error);
    // Implement reconnection logic if needed
  }
}
```

## 3. Pub/Sub Implementation

### 3.1 Channel Structure

We'll use the following channel naming conventions:

1. **User Channels**:
   - `user:{userId}` - For direct notifications to specific users

2. **Conversation Channels**:
   - `conversation:{conversationId}` - For messages in specific conversations

3. **Presence Channel**:
   - `presence` - For broadcasting online/offline status updates

4. **System Channels**:
   - `system:notifications` - For system-wide notifications
   - `system:maintenance` - For maintenance announcements

### 3.2 Message Publishing

```typescript
// messageBroker.ts
import { RedisClientType } from 'redis';

export class MessageBroker {
  private publisher: RedisClientType;
  
  constructor(publisher: RedisClientType) {
    this.publisher = publisher;
  }
  
  async publishToUser(userId: string, message: any): Promise<void> {
    try {
      await this.publisher.publish(`user:${userId}`, JSON.stringify(message));
    } catch (error) {
      console.error(`Error publishing to user ${userId}:`, error);
      throw error;
    }
  }
  
  async publishToConversation(conversationId: string, message: any): Promise<void> {
    try {
      await this.publisher.publish(`conversation:${conversationId}`, JSON.stringify(message));
    } catch (error) {
      console.error(`Error publishing to conversation ${conversationId}:`, error);
      throw error;
    }
  }
  
  async publishPresenceUpdate(userId: string, status: 'online' | 'offline'): Promise<void> {
    try {
      const message = {
        userId,
        status,
        timestamp: Date.now()
      };
      
      await this.publisher.publish('presence', JSON.stringify(message));
    } catch (error) {
      console.error(`Error publishing presence update for user ${userId}:`, error);
      throw error;
    }
  }
  
  async publishSystemNotification(message: string, level: 'info' | 'warning' | 'error'): Promise<void> {
    try {
      const notification = {
        message,
        level,
        timestamp: Date.now()
      };
      
      await this.publisher.publish('system:notifications', JSON.stringify(notification));
    } catch (error) {
      console.error('Error publishing system notification:', error);
      throw error;
    }
  }
}
```

### 3.3 Message Subscription

```typescript
// subscriptionManager.ts
import { RedisClientType } from 'redis';

export class SubscriptionManager {
  private subscriber: RedisClientType;
  private subscriptions: Map<string, Set<Function>> = new Map();
  
  constructor(subscriber: RedisClientType) {
    this.subscriber = subscriber;
  }
  
  async subscribeToUser(userId: string, callback: (message: any) => void): Promise<void> {
    const channel = `user:${userId}`;
    await this.subscribe(channel, callback);
  }
  
  async subscribeToConversation(conversationId: string, callback: (message: any) => void): Promise<void> {
    const channel = `conversation:${conversationId}`;
    await this.subscribe(channel, callback);
  }
  
  async subscribeToPresence(callback: (message: any) => void): Promise<void> {
    await this.subscribe('presence', callback);
  }
  
  async subscribeToSystemNotifications(callback: (message: any) => void): Promise<void> {
    await this.subscribe('system:notifications', callback);
  }
  
  async unsubscribeFromUser(userId: string, callback: Function): Promise<void> {
    const channel = `user:${userId}`;
    await this.unsubscribe(channel, callback);
  }
  
  async unsubscribeFromConversation(conversationId: string, callback: Function): Promise<void> {
    const channel = `conversation:${conversationId}`;
    await this.unsubscribe(channel, callback);
  }
  
  async unsubscribeFromPresence(callback: Function): Promise<void> {
    await this.unsubscribe('presence', callback);
  }
  
  async unsubscribeFromSystemNotifications(callback: Function): Promise<void> {
    await this.unsubscribe('system:notifications', callback);
  }
  
  private async subscribe(channel: string, callback: Function): Promise<void> {
    try {
      // Add callback to subscriptions map
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
        
        // Subscribe to channel if this is the first callback
        await this.subscriber.subscribe(channel, (message) => {
          try {
            const parsedMessage = JSON.parse(message);
            
            // Call all registered callbacks for this channel
            const callbacks = this.subscriptions.get(channel);
            if (callbacks) {
              callbacks.forEach(cb => {
                try {
                  cb(parsedMessage);
                } catch (error) {
                  console.error(`Error in subscription callback for channel ${channel}:`, error);
                }
              });
            }
          } catch (error) {
            console.error(`Error parsing message from channel ${channel}:`, error);
          }
        });
      }
      
      // Add the callback to the set
      this.subscriptions.get(channel)?.add(callback);
      
    } catch (error) {
      console.error(`Error subscribing to channel ${channel}:`, error);
      throw error;
    }
  }
  
  private async unsubscribe(channel: string, callback: Function): Promise<void> {
    try {
      // Remove callback from subscriptions map
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        
        // Unsubscribe from channel if no callbacks remain
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel);
          await this.subscriber.unsubscribe(channel);
        }
      }
    } catch (error) {
      console.error(`Error unsubscribing from channel ${channel}:`, error);
      throw error;
    }
  }
}
```

## 4. Caching Strategy

### 4.1 Cache Keys Structure

We'll use the following key naming conventions:

1. **User Data**:
   - `user:{userId}` - User profile data
   - `user:{userId}:conversations` - List of user's conversations
   - `user:{userId}:contacts` - User's contacts list

2. **Conversation Data**:
   - `conversation:{conversationId}` - Conversation metadata
   - `conversation:{conversationId}:messages:{page}` - Paginated messages
   - `conversation:{conversationId}:participants` - List of participants

3. **Presence Data**:
   - `presence:{userId}` - User's online status

4. **Authentication**:
   - `auth:token:{token}` - Token validation
   - `auth:refresh:{userId}` - Refresh token

### 4.2 Cache Implementation

```typescript
// cacheManager.ts
import { RedisClientType } from 'redis';

export class CacheManager {
  private cache: RedisClientType;
  
  // Default TTL values (in seconds)
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly USER_PROFILE_TTL = 3600; // 1 hour
  private readonly CONVERSATION_TTL = 900; // 15 minutes
  private readonly MESSAGES_TTL = 300; // 5 minutes
  private readonly PRESENCE_TTL = 30; // 30 seconds
  private readonly AUTH_TOKEN_TTL = 86400; // 24 hours
  
  constructor(cache: RedisClientType) {
    this.cache = cache;
  }
  
  // User caching
  async cacheUserProfile(userId: string, profile: any): Promise<void> {
    await this.cache.set(`user:${userId}`, JSON.stringify(profile), {
      EX: this.USER_PROFILE_TTL
    });
  }
  
  async getUserProfile(userId: string): Promise<any | null> {
    const data = await this.cache.get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  }
  
  async cacheUserConversations(userId: string, conversations: any[]): Promise<void> {
    await this.cache.set(`user:${userId}:conversations`, JSON.stringify(conversations), {
      EX: this.CONVERSATION_TTL
    });
  }
  
  async getUserConversations(userId: string): Promise<any[] | null> {
    const data = await this.cache.get(`user:${userId}:conversations`);
    return data ? JSON.parse(data) : null;
  }
  
  // Conversation caching
  async cacheConversation(conversationId: string, conversation: any): Promise<void> {
    await this.cache.set(`conversation:${conversationId}`, JSON.stringify(conversation), {
      EX: this.CONVERSATION_TTL
    });
  }
  
  async getConversation(conversationId: string): Promise<any | null> {
    const data = await this.cache.get(`conversation:${conversationId}`);
    return data ? JSON.parse(data) : null;
  }
  
  async cacheConversationMessages(conversationId: string, page: number, messages: any[]): Promise<void> {
    await this.cache.set(`conversation:${conversationId}:messages:${page}`, JSON.stringify(messages), {
      EX: this.MESSAGES_TTL
    });
  }
  
  async getConversationMessages(conversationId: string, page: number): Promise<any[] | null> {
    const data = await this.cache.get(`conversation:${conversationId}:messages:${page}`);
    return data ? JSON.parse(data) : null;
  }
  
  // Presence caching
  async cachePresence(userId: string, status: 'online' | 'offline'): Promise<void> {
    await this.cache.set(`presence:${userId}`, status, {
      EX: status === 'online' ? this.PRESENCE_TTL : this.DEFAULT_TTL
    });
  }
  
  async getPresence(userId: string): Promise<string | null> {
    return await this.cache.get(`presence:${userId}`);
  }
  
  async cacheMultiplePresence(userIds: string[]): Promise<Record<string, string | null>> {
    const keys = userIds.map(id => `presence:${id}`);
    const values = await this.cache.mGet(keys);
    
    const result: Record<string, string | null> = {};
    userIds.forEach((id, index) => {
      result[id] = values[index];
    });
    
    return result;
  }
  
  // Authentication caching
  async cacheAuthToken(token: string, userId: string): Promise<void> {
    await this.cache.set(`auth:token:${token}`, userId, {
      EX: this.AUTH_TOKEN_TTL
    });
  }
  
  async validateAuthToken(token: string): Promise<string | null> {
    return await this.cache.get(`auth:token:${token}`);
  }
  
  async invalidateAuthToken(token: string): Promise<void> {
    await this.cache.del(`auth:token:${token}`);
  }
  
  // Cache invalidation
  async invalidateUserCache(userId: string): Promise<void> {
    await this.cache.del(`user:${userId}`);
    await this.cache.del(`user:${userId}:conversations`);
    await this.cache.del(`user:${userId}:contacts`);
  }
  
  async invalidateConversationCache(conversationId: string): Promise<void> {
    await this.cache.del(`conversation:${conversationId}`);
    
    // Find and delete all message pages for this conversation
    const pattern = `conversation:${conversationId}:messages:*`;
    const keys = await this.scanKeys(pattern);
    
    if (keys.length > 0) {
      await this.cache.del(keys);
    }
  }
  
  // Helper method to scan for keys matching a pattern
  private async scanKeys(pattern: string): Promise<string[]> {
    let cursor = 0;
    const keys: string[] = [];
    
    do {
      const reply = await this.cache.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });
      
      cursor = reply.cursor;
      keys.push(...reply.keys);
    } while (cursor !== 0);
    
    return keys;
  }
}
```

## 5. Presence Management

### 5.1 Presence Tracking

```typescript
// presenceManager.ts
import { RedisClientType } from 'redis';
import { MessageBroker } from './messageBroker';
import { CacheManager } from './cacheManager';

export class PresenceManager {
  private publisher: RedisClientType;
  private messageBroker: MessageBroker;
  private cacheManager: CacheManager;
  
  // Heartbeat interval in milliseconds
  private readonly HEARTBEAT_INTERVAL = 20000; // 20 seconds
  private readonly PRESENCE_TIMEOUT = 30; // 30 seconds
  
  // Map of active heartbeat intervals
  private heartbeats: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    publisher: RedisClientType,
    messageBroker: MessageBroker,
    cacheManager: CacheManager
  ) {
    this.publisher = publisher;
    this.messageBroker = messageBroker;
    this.cacheManager = cacheManager;
  }
  
  async trackPresence(userId: string): Promise<void> {
    try {
      // Set user as online in cache
      await this.cacheManager.cachePresence(userId, 'online');
      
      // Publish presence update
      await this.messageBroker.publishPresenceUpdate(userId, 'online');
      
      // Set up heartbeat to keep presence active
      this.setupHeartbeat(userId);
      
    } catch (error) {
      console.error(`Error tracking presence for user ${userId}:`, error);
    }
  }
  
  async untrackPresence(userId: string): Promise<void> {
    try {
      // Clear heartbeat interval
      this.clearHeartbeat(userId);
      
      // Set user as offline in cache
      await this.cacheManager.cachePresence(userId, 'offline');
      
      // Publish presence update
      await this.messageBroker.publishPresenceUpdate(userId, 'offline');
      
    } catch (error) {
      console.error(`Error untracking presence for user ${userId}:`, error);
    }
  }
  
  private setupHeartbeat(userId: string): void {
    // Clear existing heartbeat if any
    this.clearHeartbeat(userId);
    
    // Set up new heartbeat
    const interval = setInterval(async () => {
      try {
        await this.cacheManager.cachePresence(userId, 'online');
      } catch (error) {
        console.error(`Error in heartbeat for user ${userId}:`, error);
        this.clearHeartbeat(userId);
      }
    }, this.HEARTBEAT_INTERVAL);
    
    // Store interval reference
    this.heartbeats.set(userId, interval);
  }
  
  private clearHeartbeat(userId: string): void {
    const interval = this.heartbeats.get(userId);
    if (interval) {
      clearInterval(interval);
      this.heartbeats.delete(userId);
    }
  }
  
  async getUserPresence(userId: string): Promise<'online' | 'offline'> {
    const status = await this.cacheManager.getPresence(userId);
    return status === 'online' ? 'online' : 'offline';
  }
  
  async getMultipleUserPresence(userIds: string[]): Promise<Record<string, 'online' | 'offline'>> {
    const presenceData = await this.cacheManager.cacheMultiplePresence(userIds);
    
    const result: Record<string, 'online' | 'offline'> = {};
    for (const userId in presenceData) {
      result[userId] = presenceData[userId] === 'online' ? 'online' : 'offline';
    }
    
    return result;
  }
}
```

### 5.2 Presence Subscription

```typescript
// presenceSubscriber.ts
import { SubscriptionManager } from './subscriptionManager';
import { Db } from 'mongodb';

export class PresenceSubscriber {
  private subscriptionManager: SubscriptionManager;
  private db: Db;
  private handlers: Map<string, Function> = new Map();
  
  constructor(subscriptionManager: SubscriptionManager, db: Db) {
    this.subscriptionManager = subscriptionManager;
    this.db = db;
  }
  
  async initialize(): Promise<void> {
    // Subscribe to presence channel
    await this.subscriptionManager.subscribeToPresence(this.handlePresenceUpdate.bind(this));
  }
  
  async subscribeToUserPresence(userId: string, callback: (status: 'online' | 'offline') => void): Promise<() => void> {
    const handlerId = `${userId}-${Date.now()}`;
    
    // Store handler
    this.handlers.set(handlerId, callback);
    
    // Return unsubscribe function
    return () => {
      this.handlers.delete(handlerId);
    };
  }
  
  private async handlePresenceUpdate(data: { userId: string, status: 'online' | 'offline', timestamp: number }): Promise<void> {
    try {
      const { userId, status, timestamp } = data;
      
      // Update user's last seen timestamp in database if going offline
      if (status === 'offline') {
        await this.db.collection('users').updateOne(
          { _id: userId },
          { $set: { lastSeen: new Date(timestamp) } }
        );
      }
      
      // Notify all handlers interested in this user's presence
      for (const [id, handler] of this.handlers.entries()) {
        if (id.startsWith(userId)) {
          try {
            handler(status);
          } catch (error) {
            console.error(`Error in presence handler ${id}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('Error handling presence update:', error);
    }
  }
}
```

## 6. Rate Limiting

### 6.1 Rate Limiter Implementation

```typescript
// rateLimiter.ts
import { RedisClientType } from 'redis';

export class RateLimiter {
  private cache: RedisClientType;
  
  // Default rate limits
  private readonly DEFAULT_LIMIT = 60; // requests
  private readonly DEFAULT_WINDOW = 60; // seconds
  
  // Rate limit configurations for different actions
  private readonly LIMITS = {
    'message:send': { limit: 60, window: 60 }, // 60 messages per minute
    'conversation:create': { limit: 10, window: 60 }, // 10 new conversations per minute
    'user:search': { limit: 30, window: 60 }, // 30 user searches per minute
    'presence:update': { limit: 10, window: 60 } // 10 presence updates per minute
  };
  
  constructor(cache: RedisClientType) {
    this.cache = cache;
  }
  
  async isAllowed(userId: string, action: string): Promise<boolean> {
    const key = `ratelimit:${userId}:${action}`;
    const config = this.LIMITS[action] || { limit: this.DEFAULT_LIMIT, window: this.DEFAULT_WINDOW };
    
    try {
      // Get current count
      const count = await this.cache.get(key);
      const currentCount = count ? parseInt(count, 10) : 0;
      
      if (currentCount >= config.limit) {
        return false;
      }
      
      // Increment count
      if (currentCount === 0) {
        // First request in window, set with expiry
        await this.cache.set(key, '1', {
          EX: config.window
        });
      } else {
        // Increment existing count
        await this.cache.incr(key);
      }
      
      return true;
    } catch (error) {
      console.error(`Error checking rate limit for ${userId}/${action}:`, error);
      // In case of error, allow the request
      return true;
    }
  }
  
  async getRemainingLimit(userId: string, action: string): Promise<{ remaining: number, resetIn: number }> {
    const key = `ratelimit:${userId}:${action}`;
    const config = this.LIMITS[action] || { limit: this.DEFAULT_LIMIT, window: this.DEFAULT_WINDOW };
    
    try {
      // Get current count and TTL
      const [count, ttl] = await Promise.all([
        this.cache.get(key),
        this.cache.ttl(key)
      ]);
      
      const currentCount = count ? parseInt(count, 10) : 0;
      const remaining = Math.max(0, config.limit - currentCount);
      const resetIn = ttl > 0 ? ttl : config.window;
      
      return { remaining, resetIn };
    } catch (error) {
      console.error(`Error getting rate limit info for ${userId}/${action}:`, error);
      return { remaining: config.limit, resetIn: config.window };
    }
  }
}
```

## 7. Distributed Locks

### 7.1 Lock Manager

```typescript
// lockManager.ts
import { RedisClientType } from 'redis';

export class LockManager {
  private cache: RedisClientType;
  
  // Default lock settings
  private readonly DEFAULT_TTL = 30; // 30 seconds
  private readonly LOCK_PREFIX = 'lock:';
  
  constructor(cache: RedisClientType) {
    this.cache = cache;
  }
  
  async acquireLock(resource: string, ttlSeconds: number = this.DEFAULT_TTL): Promise<string | null> {
    const lockId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const key = `${this.LOCK_PREFIX}${resource}`;
    
    try {
      // Try to set the lock with NX option (only if it doesn't exist)
      const result = await this.cache.set(key, lockId, {
        NX: true,
        EX: ttlSeconds
      });
      
      // If result is OK, lock was acquired
      return result === 'OK' ? lockId : null;
    } catch (error) {
      console.error(`Error acquiring lock for ${resource}:`, error);
      return null;
    }
  }
  
  async releaseLock(resource: string, lockId: string): Promise<boolean> {
    const key = `${this.LOCK_PREFIX}${resource}`;
    
    try {
      // Get the current lock value
      const currentLockId = await this.cache.get(key);
      
      // Only release if the lock ID matches
      if (currentLockId === lockId) {
        await this.cache.del(key);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error releasing lock for ${resource}:`, error);
      return false;
    }
  }
  
  async withLock<T>(resource: string, callback: () => Promise<T>, ttlSeconds: number = this.DEFAULT_TTL): Promise<T | null> {
    const lockId = await this.acquireLock(resource, ttlSeconds);
    
    if (!lockId) {
      console.warn(`Failed to acquire lock for ${resource}`);
      return null;
    }
    
    try {
      // Execute the callback while holding the lock
      return await callback();
    } finally {
      // Always release the lock
      await this.releaseLock(resource, lockId);
    }
  }
}
```

## 8. Message Queue for Offline Delivery

### 8.1 Message Queue Implementation

```typescript
// messageQueue.ts
import { RedisClientType } from 'redis';

export class MessageQueue {
  private cache: RedisClientType;
  
  // Queue settings
  private readonly QUEUE_PREFIX = 'queue:messages:';
  private readonly MAX_QUEUE_SIZE = 100; // Maximum number of messages per user
  private readonly MESSAGE_TTL = 604800; // 7 days in seconds
  
  constructor(cache: RedisClientType) {
    this.cache = cache;
  }
  
  async enqueueMessage(userId: string, message: any): Promise<boolean> {
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    try {
      // Add message to the user's queue with timestamp
      const messageWithTimestamp = {
        ...message,
        queuedAt: Date.now()
      };
      
      // Use LPUSH to add to the beginning of the list
      await this.cache.lPush(queueKey, JSON.stringify(messageWithTimestamp));
      
      // Trim the queue to maximum size
      await this.cache.lTrim(queueKey, 0, this.MAX_QUEUE_SIZE - 1);
      
      // Set expiry on the queue if not already set
      const ttl = await this.cache.ttl(queueKey);
      if (ttl < 0) {
        await this.cache.expire(queueKey, this.MESSAGE_TTL);
      }
      
      return true;
    } catch (error) {
      console.error(`Error enqueuing message for user ${userId}:`, error);
      return false;
    }
  }
  
  async dequeueMessages(userId: string, limit: number = 50): Promise<any[]> {
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    try {
      // Get messages from the queue (oldest first)
      const messages = await this.cache.lRange(queueKey, -limit, -1);
      
      if (messages.length === 0) {
        return [];
      }
      
      // Parse messages
      const parsedMessages = messages.map(msg => JSON.parse(msg));
      
      // Remove retrieved messages from the queue
      await this.cache.lTrim(queueKey, 0, -messages.length - 1);
      
      return parsedMessages;
    } catch (error) {
      console.error(`Error dequeuing messages for user ${userId}:`, error);
      return [];
    }
  }
  
  async peekMessages(userId: string, limit: number = 50): Promise<any[]> {
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    try {
      // Get messages from the queue without removing them
      const messages = await this.cache.lRange(queueKey, -limit, -1);
      
      // Parse messages
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      console.error(`Error peeking messages for user ${userId}:`, error);
      return [];
    }
  }
  
  async getQueueLength(userId: string): Promise<number> {
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    try {
      return await this.cache.lLen(queueKey);
    } catch (error) {
      console.error(`Error getting queue length for user ${userId}:`, error);
      return 0;
    }
  }
  
  async clearQueue(userId: string): Promise<boolean> {
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    try {
      await this.cache.del(queueKey);
      return true;
    } catch (error) {
      console.error(`Error clearing queue for user ${userId}:`, error);
      return false;
    }
  }
}
```

## 9. Typing Indicators

### 9.1 Typing Indicator Implementation

```typescript
// typingIndicator.ts
import { RedisClientType } from 'redis';
import { MessageBroker } from './messageBroker';

export class TypingIndicator {
  private cache: RedisClientType;
  private messageBroker: MessageBroker;
  
  // Typing indicator settings
  private readonly TYPING_PREFIX = 'typing:';
  private readonly TYPING_TTL = 5; // 5 seconds
  
  constructor(cache: RedisClientType, messageBroker: MessageBroker) {
    this.cache = cache;
    this.messageBroker = messageBroker;
  }
  
  async setTyping(userId: string, conversationId: string, isTyping: boolean): Promise<void> {
    const key = `${this.TYPING_PREFIX}${conversationId}:${userId}`;
    
    try {
      if (isTyping) {
        // Set typing indicator with TTL
        await this.cache.set(key, 'typing', {
          EX: this.TYPING_TTL
        });
      } else {
        // Remove typing indicator
        await this.cache.del(key);
      }
      
      // Publish typing indicator update
      await this.messageBroker.publishToConversation(conversationId, {
        type: 'typing_indicator',
        userId,
        isTyping,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Error setting typing indicator for user ${userId} in conversation ${conversationId}:`, error);
    }
  }
  
  async getTypingUsers(conversationId: string): Promise<string[]> {
    const pattern = `${this.TYPING_PREFIX}${conversationId}:*`;
    
    try {
      // Scan for all typing indicators for this conversation
      const keys = await this.scanKeys(pattern);
      
      // Extract user IDs from keys
      return keys.map(key => {
        const parts = key.split(':');
        return parts[parts.length - 1];
      });
    } catch (error) {
      console.error(`Error getting typing users for conversation ${conversationId}:`, error);
      return [];
    }
  }
  
  // Helper method to scan for keys matching a pattern
  private async scanKeys(pattern: string): Promise<string[]> {
    let cursor = 0;
    const keys: string[] = [];
    
    do {
      const reply = await this.cache.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });
      
      cursor = reply.cursor;
      keys.push(...reply.keys);
    } while (cursor !== 0);
    
    return keys;
  }
}
```

## 10. Monitoring and Metrics

### 10.1 Redis Metrics Collector

```typescript
// redisMetrics.ts
import { RedisClientType } from 'redis';

export class RedisMetrics {
  private cache: RedisClientType;
  
  // Metrics keys
  private readonly METRICS_PREFIX = 'metrics:';
  private readonly METRICS_TTL = 86400; // 1 day in seconds
  
  constructor(cache: RedisClientType) {
    this.cache = cache;
  }
  
  async incrementCounter(metric: string, value: number = 1): Promise<void> {
    const key = `${this.METRICS_PREFIX}counter:${metric}`;
    
    try {
      await this.cache.incrBy(key, value);
      
      // Set expiry if not already set
      const ttl = await this.cache.ttl(key);
      if (ttl < 0) {
        await this.cache.expire(key, this.METRICS_TTL);
      }
    } catch (error) {
      console.error(`Error incrementing counter for ${metric}:`, error);
    }
  }
  
  async recordLatency(metric: string, latencyMs: number): Promise<void> {
    const key = `${this.METRICS_PREFIX}latency:${metric}`;
    
    try {
      // Add latency to sorted set with timestamp as score
      await this.cache.zAdd(key, {
        score: Date.now(),
        value: latencyMs.toString()
      });
      
      // Trim to keep only recent values (last 1000)
      await this.cache.zRemRangeByRank(key, 0, -1001);
      
      // Set expiry if not already set
      const ttl = await this.cache.ttl(key);
      if (ttl < 0) {
        await this.cache.expire(key, this.METRICS_TTL);
      }
    } catch (error) {
      console.error(`Error recording latency for ${metric}:`, error);
    }
  }
  
  async getCounter(metric: string): Promise<number> {
    const key = `${this.METRICS_PREFIX}counter:${metric}`;
    
    try {
      const value = await this.cache.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error(`Error getting counter for ${metric}:`, error);
      return 0;
    }
  }
  
  async getLatencyStats(metric: string): Promise<{ avg: number, p95: number, p99: number }> {
    const key = `${this.METRICS_PREFIX}latency:${metric}`;
    
    try {
      // Get all latency values
      const values = await this.cache.zRange(key, 0, -1);
      
      if (values.length === 0) {
        return { avg: 0, p95: 0, p99: 0 };
      }
      
      // Convert to numbers
      const latencies = values.map(v => parseInt(v, 10));
      
      // Calculate average
      const sum = latencies.reduce((acc, val) => acc + val, 0);
      const avg = sum / latencies.length;
      
      // Sort for percentiles
      latencies.sort((a, b) => a - b);
      
      // Calculate percentiles
      const p95Index = Math.floor(latencies.length * 0.95);
      const p99Index = Math.floor(latencies.length * 0.99);
      
      return {
        avg,
        p95: latencies[p95Index],
        p99: latencies[p99Index]
      };
    } catch (error) {
      console.error(`Error getting latency stats for ${metric}:`, error);
      return { avg: 0, p95: 0, p99: 0 };
    }
  }
  
  async recordActiveUsers(userIds: string[]): Promise<void> {
    const key = `${this.METRICS_PREFIX}active_users`;
    const timestamp = Math.floor(Date.now() / 1000 / 60); // Current minute
    
    try {
      // Add users to set with current minute as key
      const minuteKey = `${key}:${timestamp}`;
      
      if (userIds.length > 0) {
        await this.cache.sAdd(minuteKey, userIds);
        await this.cache.expire(minuteKey, 3600); // Keep for 1 hour
      }
    } catch (error) {
      console.error('Error recording active users:', error);
    }
  }
  
  async getActiveUserCount(minutes: number = 5): Promise<number> {
    const key = `${this.METRICS_PREFIX}active_users`;
    const currentTimestamp = Math.floor(Date.now() / 1000 / 60);
    
    try {
      // Create union of all minute sets for the specified time range
      const keys = [];
      for (let i = 0; i < minutes; i++) {
        keys.push(`${key}:${currentTimestamp - i}`);
      }
      
      if (keys.length === 0) {
        return 0;
      }
      
      // Use temporary key for union
      const tempKey = `${key}:temp:${Date.now()}`;
      await this.cache.sUnionStore(tempKey, keys);
      
      // Get count
      const count = await this.cache.sCard(tempKey);
      
      // Clean up
      await this.cache.del(tempKey);
      
      return count;
    } catch (error) {
      console.error(`Error getting active user count for last ${minutes} minutes:`, error);
      return 0;
    }
  }
}
```

## 11. Redis Health Check

### 11.1 Health Check Implementation

```typescript
// redisHealth.ts
import { RedisClientType } from 'redis';

export class RedisHealth {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private cache: RedisClientType;
  
  constructor(
    publisher: RedisClientType,
    subscriber: RedisClientType,
    cache: RedisClientType
  ) {
    this.publisher = publisher;
    this.subscriber = subscriber;
    this.cache = cache;
  }
  
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      publisher: boolean;
      subscriber: boolean;
      cache: boolean;
      latency: number;
    };
  }> {
    const details = {
      publisher: this.publisher.isOpen,
      subscriber: this.subscriber.isOpen,
      cache: this.cache.isOpen,
      latency: -1
    };
    
    try {
      // Check latency with PING command
      const start = Date.now();
      await this.cache.ping();
      details.latency = Date.now() - start;
      
      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!details.publisher || !details.subscriber || !details.cache) {
        status = 'unhealthy';
      } else if (details.latency > 100) { // More than 100ms is considered degraded
        status = 'degraded';
      }
      
      return { status, details };
    } catch (error) {
      console.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          ...details,
          latency: -1
        }
      };
    }
  }
  
  async runDeepHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      publisher: boolean;
      subscriber: boolean;
      cache: boolean;
      pubSubLatency: number;
      writeLatency: number;
      readLatency: number;
      memoryUsage: {
        used: number;
        peak: number;
        total: number;
      };
    };
  }> {
    try {
      // Basic health check
      const basicHealth = await this.checkHealth();
      
      if (basicHealth.status === 'unhealthy') {
        return {
          status: 'unhealthy',
          details: {
            publisher: basicHealth.details.publisher,
            subscriber: basicHealth.details.subscriber,
            cache: basicHealth.details.cache,
            pubSubLatency: -1,
            writeLatency: -1,
            readLatency: -1,
            memoryUsage: {
              used: -1,
              peak: -1,
              total: -1
            }
          }
        };
      }
      
      // Test pub/sub latency
      const pubSubLatency = await this.testPubSubLatency();
      
      // Test write latency
      const writeStart = Date.now();
      await this.cache.set('health:test:write', 'test', { EX: 10 });
      const writeLatency = Date.now() - writeStart;
      
      // Test read latency
      const readStart = Date.now();
      await this.cache.get('health:test:write');
      const readLatency = Date.now() - readStart;
      
      // Get memory usage
      const info = await this.cache.info('memory');
      const memoryInfo = this.parseMemoryInfo(info);
      
      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (pubSubLatency > 200 || writeLatency > 100 || readLatency > 50) {
        status = 'degraded';
      }
      
      if (pubSubLatency === -1) {
        status = 'unhealthy';
      }
      
      return {
        status,
        details: {
          publisher: basicHealth.details.publisher,
          subscriber: basicHealth.details.subscriber,
          cache: basicHealth.details.cache,
          pubSubLatency,
          writeLatency,
          readLatency,
          memoryUsage: memoryInfo
        }
      };
    } catch (error) {
      console.error('Redis deep health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          publisher: false,
          subscriber: false,
          cache: false,
          pubSubLatency: -1,
          writeLatency: -1,
          readLatency: -1,
          memoryUsage: {
            used: -1,
            peak: -1,
            total: -1
          }
        }
      };
    }
  }
  
  private async testPubSubLatency(): Promise<number> {
    return new Promise<number>((resolve) => {
      const testChannel = `health:test:${Date.now()}`;
      const testMessage = `test:${Date.now()}`;
      let timeout: NodeJS.Timeout;
      
      // Set timeout for pub/sub test
      timeout = setTimeout(() => {
        this.subscriber.unsubscribe(testChannel).catch(console.error);
        resolve(-1);
      }, 5000);
      
      // Subscribe to test channel
      this.subscriber.subscribe(testChannel, (message) => {
        if (message === testMessage) {
          clearTimeout(timeout);
          this.subscriber.unsubscribe(testChannel).catch(console.error);
          resolve(Date.now() - parseInt(testMessage.split(':')[1], 10));
        }
      }).then(() => {
        // Publish test message
        this.publisher.publish(testChannel, testMessage).catch(console.error);
      }).catch((error) => {
        console.error('Error in pub/sub test:', error);
        clearTimeout(timeout);
        resolve(-1);
      });
    });
  }
  
  private parseMemoryInfo(info: string): { used: number; peak: number; total: number } {
    try {
      const lines = info.split('\r\n');
      let used = -1;
      let peak = -1;
      let total = -1;
      
      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          used = parseInt(line.split(':')[1], 10);
        } else if (line.startsWith('used_memory_peak:')) {
          peak = parseInt(line.split(':')[1], 10);
        } else if (line.startsWith('total_system_memory:')) {
          total = parseInt(line.split(':')[1], 10);
        }
      }
      
      return { used, peak, total };
    } catch (error) {
      console.error('Error parsing memory info:', error);
      return { used: -1, peak: -1, total: -1 };
    }
  }
}
```

## 12. Redis Integration with WebSocket Server

### 12.1 Integration Example

```typescript
// server.ts
import * as http from 'http';
import { WebSocketServer } from 'ws';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

import { RedisManager } from './redisManager';
import { MessageBroker } from './messageBroker';
import { SubscriptionManager } from './subscriptionManager';
import { CacheManager } from './cacheManager';
import { PresenceManager } from './presenceManager';
import { RateLimiter } from './rateLimiter';
import { LockManager } from './lockManager';
import { MessageQueue } from './messageQueue';
import { TypingIndicator } from './typingIndicator';
import { RedisMetrics } from './redisMetrics';
import { RedisHealth } from './redisHealth';

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
    
    // Initialize Redis
    const redisManager = new RedisManager(REDIS_URI);
    await redisManager.connect();
    
    // Get Redis clients
    const publisher = redisManager.getPublisher();
    const subscriber = redisManager.getSubscriber();
    const cache = redisManager.getCache();
    
    // Initialize Redis services
    const messageBroker = new MessageBroker(publisher);
    const subscriptionManager = new SubscriptionManager(subscriber);
    const cacheManager = new CacheManager(cache);
    const presenceManager = new PresenceManager(publisher, messageBroker, cacheManager);
    const rateLimiter = new RateLimiter(cache);
    const lockManager = new LockManager(cache);
    const messageQueue = new MessageQueue(cache);
    const typingIndicator = new TypingIndicator(cache, messageBroker);
    const redisMetrics = new RedisMetrics(cache);
    const redisHealth = new RedisHealth(publisher, subscriber, cache);
    
    // Set up WebSocket connection handling
    wss.on('connection', async (socket, request) => {
      console.log('New connection attempt');
      
      // Extract token from query string
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        socket.close(1008, 'Authentication required');
        return;
      }
      
      // Validate token (using cache for faster validation)
      const userId = await cacheManager.validateAuthToken(token);
      
      if (!userId) {
        socket.close(1008, 'Authentication failed');
        return;
      }
      
      // Check rate limit for connections
      if (!(await rateLimiter.isAllowed(userId, 'connection:create'))) {
        socket.close(1008, 'Rate limit exceeded');
        return;
      }
      
      // Associate socket with user ID
      socket.userId = userId;
      
      // Track user presence
      await presenceManager.trackPresence(userId);
      
      // Subscribe to user's personal channel
      const userChannelUnsubscribe = await subscriptionManager.subscribeToUser(userId, (message) => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify(message));
        }
      });
      
      // Check for queued messages
      const queuedMessages = await messageQueue.dequeueMessages(userId);
      if (queuedMessages.length > 0) {
        // Send queued messages to client
        socket.send(JSON.stringify({
          type: 'queued_messages',
          messages: queuedMessages
        }));
      }
      
      // Handle incoming messages
      socket.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Record metrics
          redisMetrics.incrementCounter('messages_received');
          const startTime = Date.now();
          
          // Process different message types
          switch (message.type) {
            case 'send_message':
              await handleSendMessage(message);
              break;
              
            case 'typing_indicator':
              await handleTypingIndicator(message);
              break;
              
            case 'read_receipt':
              await handleReadReceipt(message);
              break;
              
            default:
              socket.send(JSON.stringify({
                type: 'error',
                code: 'UNKNOWN_MESSAGE_TYPE',
                message: 'Unknown message type'
              }));
          }
          
          // Record processing latency
          redisMetrics.recordLatency('message_processing', Date.now() - startTime);
        } catch (error) {
          console.error('Error processing message:', error);
          socket.send(JSON.stringify({
            type: 'error',
            code: 'INVALID_FORMAT',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Handle disconnection
      socket.on('close', async () => {
        // Untrack presence
        await presenceManager.untrackPresence(userId);
        
        // Unsubscribe from user's channel
        userChannelUnsubscribe();
        
        console.log(`User ${userId} disconnected`);
      });
      
      // Send connection confirmation
      socket.send(JSON.stringify({
        type: 'connected',
        userId
      }));
      
      console.log(`User ${userId} connected`);
      
      // Record active user
      redisMetrics.recordActiveUsers([userId]);
      
      // Helper function to handle send_message
      async function handleSendMessage(message) {
        const { conversationId, content, contentType = 'text' } = message;
        
        // Check rate limit for sending messages
        if (!(await rateLimiter.isAllowed(userId, 'message:send'))) {
          socket.send(JSON.stringify({
            type: 'error',
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded for sending messages'
          }));
          return;
        }
        
        // Validate message
        if (!conversationId || !content) {
          socket.send(JSON.stringify({
            type: 'error',
            code: 'INVALID_MESSAGE',
            message: 'Missing required fields'
          }));
          return;
        }
        
        // Process message (implementation details omitted for brevity)
        // This would typically involve:
        // 1. Validating the user is part of the conversation
        // 2. Persisting the message to MongoDB
        // 3. Publishing the message to the conversation channel
        // 4. Sending delivery confirmation to the sender
        
        // For offline recipients, queue the message
        const offlineRecipients = []; // This would be determined by checking presence
        for (const recipientId of offlineRecipients) {
          await messageQueue.enqueueMessage(recipientId, {
            type: 'new_message',
            conversationId,
            sender: userId,
            content,
            contentType,
            sentAt: Date.now()
          });
        }
      }
      
      // Helper function to handle typing_indicator
      async function handleTypingIndicator(message) {
        const { conversationId, isTyping } = message;
        
        // Check rate limit for typing indicators
        if (!(await rateLimiter.isAllowed(userId, 'typing:update'))) {
          return; // Silently fail for typing indicators
        }
        
        // Update typing indicator
        await typingIndicator.setTyping(userId, conversationId, isTyping);
      }
      
      // Helper function to handle read_receipt
      async function handleReadReceipt(message) {
        const { messageId } = message;
        
        // Check rate limit for read receipts
        if (!(await rateLimiter.isAllowed(userId, 'receipt:send'))) {
          return; // Silently fail for read receipts
        }
        
        // Process read receipt (implementation details omitted for brevity)
        // This would typically involve:
        // 1. Updating the message in MongoDB
        // 2. Publishing the read receipt to the conversation channel
      }
    });
    
    // Set up health check endpoint
    server.on('request', async (req, res) => {
      if (req.url === '/health') {
        const health = await redisHealth.checkHealth();
        
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(health.status === 'healthy' ? 200 : 503);
        res.end(JSON.stringify({
          status: health.status,
          redis: health.details,
          connections: wss.clients.size,
          timestamp: new Date().toISOString()
        }));
      }
    });
    
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
      await redisManager.disconnect();
      
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

## 13. Deployment Considerations

### 13.1 Redis Cluster Setup in Production

For a production environment, consider the following Redis Cluster setup:

1. **Minimum Configuration**:
   - 3 master nodes
   - 3 replica nodes (1 replica per master)
   - Distributed across different availability zones

2. **Resource Allocation**:
   - Memory: 8GB per node minimum
   - CPU: 2 vCPUs per node minimum
   - Network: 1 Gbps minimum

3. **Persistence Configuration**:
   ```
   # redis.conf
   appendonly yes
   appendfsync everysec
   ```

4. **Security Settings**:
   ```
   # redis.conf
   requirepass StrongPasswordHere
   protected-mode yes
   ```

5. **Monitoring**:
   - Set up Redis Exporter for Prometheus
   - Configure alerts for:
     - High memory usage (>80%)
     - High CPU usage (>70%)
     - Slow commands (>100ms)
     - Connection count approaching max

### 13.2 Scaling Considerations

1. **Horizontal Scaling**:
   - Add more Redis nodes as load increases
   - Use consistent hashing for client-side sharding

2. **Memory Optimization**:
   - Use Redis key expiration for all cached data
   - Implement LRU policies for cache eviction
   - Monitor memory usage and fragmentation

3. **Connection Pooling**:
   - Use connection pooling in clients
   - Set appropriate pool sizes based on load
   - Monitor connection usage

4. **Backup Strategy**:
   - Regular RDB snapshots
   - AOF persistence for critical data
   - Test restore procedures regularly