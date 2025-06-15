# MongoDB Schema Design for Chat Application

This document outlines the MongoDB schema design for our real-time chat application, focusing on optimizing for common access patterns while ensuring scalability and performance.

## 1. Collections Overview

Our MongoDB database will consist of the following collections:

1. `users` - User profiles and authentication data
2. `conversations` - Metadata about 1:1 and group conversations
3. `messages` - Actual message content with references to conversations
4. `presence` - User online/offline status (optional, can be in Redis instead)

## 2. Schema Definitions

### 2.1 Users Collection

```javascript
{
  _id: ObjectId,                // Unique identifier
  username: String,             // Unique username
  email: String,                // Unique email address
  passwordHash: String,         // Hashed password
  firstName: String,            // First name
  lastName: String,             // Last name
  avatar: String,               // URL to avatar image
  status: {                     // User status
    text: String,               // Status text
    emoji: String               // Status emoji
  },
  lastSeen: Date,               // Last time user was active
  settings: {                   // User preferences
    notifications: Boolean,     // Enable/disable notifications
    theme: String,              // UI theme preference
    language: String            // Preferred language
  },
  contacts: [ObjectId],         // Array of user IDs (contacts/friends)
  createdAt: Date,              // Account creation timestamp
  updatedAt: Date               // Last update timestamp
}
```

#### Indexes:
```javascript
// Primary key (automatically created)
{ _id: 1 }

// For authentication and lookup
{ email: 1 }, { unique: true }
{ username: 1 }, { unique: true }

// For searching users
{ firstName: 1, lastName: 1 }

// For sorting by activity
{ lastSeen: -1 }
```

### 2.2 Conversations Collection

```javascript
{
  _id: ObjectId,                // Unique identifier
  type: String,                 // "direct" or "group"
  participants: [ObjectId],     // Array of user IDs
  createdBy: ObjectId,          // User who created the conversation
  name: String,                 // Group name (for group conversations)
  avatar: String,               // Group avatar URL (for group conversations)
  lastMessage: {                // Preview of the last message
    content: String,            // Content preview (truncated)
    sender: ObjectId,           // User ID of sender
    sentAt: Date                // Timestamp
  },
  metadata: {                   // Additional metadata
    isEncrypted: Boolean,       // Whether conversation is end-to-end encrypted
    customColor: String,        // Custom theme color
    pinnedMessages: [ObjectId]  // Array of pinned message IDs
  },
  settings: {                   // Conversation settings
    notifications: Boolean,     // Enable/disable notifications
    muteUntil: Date             // Mute until this time
  },
  createdAt: Date,              // Creation timestamp
  updatedAt: Date               // Last update timestamp
}
```

#### Indexes:
```javascript
// Primary key (automatically created)
{ _id: 1 }

// For finding user's conversations
{ participants: 1 }

// For sorting conversations by recent activity
{ "lastMessage.sentAt": -1 }

// Compound index for finding conversations between specific users
{ participants: 1, type: 1 }
```

### 2.3 Messages Collection

```javascript
{
  _id: ObjectId,                // Unique identifier
  conversationId: ObjectId,     // Reference to conversation
  sender: ObjectId,             // User ID of sender
  content: String,              // Message content
  contentType: String,          // "text", "image", "file", "location", etc.
  attachments: [{               // Array of attachments
    type: String,               // "image", "video", "file", etc.
    url: String,                // URL to resource
    name: String,               // Original filename
    size: Number,               // File size in bytes
    mimeType: String            // MIME type
  }],
  mentions: [ObjectId],         // Array of mentioned user IDs
  reactions: [{                 // Array of reactions
    user: ObjectId,             // User ID
    type: String,               // Reaction type (emoji)
    createdAt: Date             // Timestamp
  }],
  replyTo: ObjectId,            // Reference to parent message (if reply)
  readBy: [{                    // Array of read receipts
    userId: ObjectId,           // User ID
    readAt: Date                // Timestamp
  }],
  deliveredTo: [{               // Array of delivery receipts
    userId: ObjectId,           // User ID
    deliveredAt: Date           // Timestamp
  }],
  status: String,               // "sent", "delivered", "read", "failed"
  metadata: {                   // Additional metadata
    edited: Boolean,            // Whether message was edited
    editedAt: Date,             // Last edit timestamp
    forwardedFrom: ObjectId,    // Original message if forwarded
    location: {                 // For location sharing
      latitude: Number,
      longitude: Number,
      name: String              // Location name
    }
  },
  sentAt: Date,                 // Sent timestamp
  updatedAt: Date               // Last update timestamp
}
```

#### Indexes:
```javascript
// Primary key (automatically created)
{ _id: 1 }

// For retrieving conversation messages
{ conversationId: 1, sentAt: 1 }

// For finding messages by sender
{ sender: 1, sentAt: -1 }

// For finding messages mentioning a user
{ mentions: 1, sentAt: -1 }

// For finding replies to a specific message
{ replyTo: 1 }

// TTL index for auto-deleting ephemeral messages
{ "metadata.expiresAt": 1 }, { expireAfterSeconds: 0 }
```

### 2.4 Presence Collection (Optional)

```javascript
{
  _id: ObjectId,                // User ID
  status: String,               // "online", "offline", "away", "busy"
  lastActive: Date,             // Last activity timestamp
  device: String,               // "mobile", "desktop", "web"
  updatedAt: Date               // Last update timestamp
}
```

#### Indexes:
```javascript
// Primary key (automatically created)
{ _id: 1 }

// For finding recently active users
{ status: 1, lastActive: -1 }
```

## 3. Sharding Strategy

As the application scales, we'll need to implement sharding to distribute data across multiple servers. Here's the recommended sharding strategy:

### 3.1 Users Collection

- Shard key: `{ _id: 1 }`
- Rationale: Even distribution of user documents

### 3.2 Conversations Collection

- Shard key: `{ _id: 1 }`
- Rationale: Even distribution of conversation documents

### 3.3 Messages Collection

- Shard key: `{ conversationId: 1, sentAt: 1 }`
- Rationale:
  - Groups messages from the same conversation together
  - Allows efficient retrieval of conversation history
  - Provides chronological ordering within each conversation
  - Distributes data based on conversation activity

## 4. Data Access Patterns

### 4.1 Common Queries

#### Get User Profile
```javascript
db.users.findOne({ _id: userId });
```

#### Get User's Conversations
```javascript
db.conversations.find(
  { participants: userId },
  { sort: { "lastMessage.sentAt": -1 } }
);
```

#### Get Conversation Messages
```javascript
db.messages.find(
  { conversationId: conversationId },
  { sort: { sentAt: 1 }, skip: offset, limit: pageSize }
);
```

#### Get Unread Messages Count
```javascript
db.messages.countDocuments({
  conversationId: conversationId,
  sender: { $ne: userId },
  "readBy.userId": { $ne: userId }
});
```

#### Mark Messages as Read
```javascript
db.messages.updateMany(
  {
    conversationId: conversationId,
    sender: { $ne: userId },
    "readBy.userId": { $ne: userId }
  },
  {
    $push: {
      readBy: {
        userId: userId,
        readAt: new Date()
      }
    }
  }
);
```

#### Search Messages
```javascript
db.messages.find(
  {
    conversationId: conversationId,
    content: { $regex: searchTerm, $options: "i" }
  },
  { sort: { sentAt: -1 } }
);
```

### 4.2 Aggregation Pipelines

#### Get Conversation Summary with Last Message
```javascript
db.conversations.aggregate([
  { $match: { participants: userId } },
  {
    $lookup: {
      from: "messages",
      let: { conversationId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$conversationId", "$$conversationId"] } } },
        { $sort: { sentAt: -1 } },
        { $limit: 1 }
      ],
      as: "lastMessageDetails"
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "participants",
      foreignField: "_id",
      as: "participantDetails"
    }
  },
  {
    $project: {
      _id: 1,
      type: 1,
      name: 1,
      avatar: 1,
      participants: "$participantDetails",
      lastMessage: { $arrayElemAt: ["$lastMessageDetails", 0] },
      updatedAt: 1
    }
  },
  { $sort: { "lastMessage.sentAt": -1 } }
]);
```

#### Get Unread Messages Count by Conversation
```javascript
db.messages.aggregate([
  {
    $match: {
      sender: { $ne: userId },
      "readBy.userId": { $ne: userId },
      conversationId: { $in: userConversationIds }
    }
  },
  {
    $group: {
      _id: "$conversationId",
      unreadCount: { $sum: 1 }
    }
  }
]);
```

## 5. Data Consistency and Integrity

### 5.1 Validation Rules

#### Users Collection
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "passwordHash", "createdAt"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        passwordHash: {
          bsonType: "string"
        },
        // Additional properties...
      }
    }
  }
}
```

#### Messages Collection
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversationId", "sender", "contentType", "sentAt"],
      properties: {
        conversationId: {
          bsonType: "objectId"
        },
        sender: {
          bsonType: "objectId"
        },
        content: {
          bsonType: ["string", "null"]
        },
        contentType: {
          enum: ["text", "image", "file", "location", "audio", "video"]
        },
        // Additional properties...
      }
    }
  }
}
```

### 5.2 Referential Integrity

While MongoDB doesn't enforce referential integrity like relational databases, we can implement application-level checks:

1. When deleting a user:
   - Archive or anonymize their messages
   - Remove them from conversation participants
   - Delete or archive their conversations

2. When deleting a conversation:
   - Delete all associated messages

## 6. Performance Optimization

### 6.1 Indexing Strategy

We've already defined the primary indexes above. Additional considerations:

1. **Covered Queries**: Design indexes to cover common queries, reducing the need to fetch documents.
2. **Compound Indexes**: Use compound indexes for queries with multiple filter conditions.
3. **Text Indexes**: For message content searching:
   ```javascript
   db.messages.createIndex({ content: "text" });
   ```
4. **Partial Indexes**: For filtering on specific subsets:
   ```javascript
   // Index only for group conversations
   db.conversations.createIndex(
     { participants: 1 },
     { partialFilterExpression: { type: "group" } }
   );
   ```

### 6.2 Read Concerns and Write Concerns

- For critical operations (user creation, message sending):
  ```javascript
  { writeConcern: { w: "majority" } }
  ```

- For read operations requiring consistency:
  ```javascript
  { readConcern: { level: "majority" } }
  ```

- For read operations prioritizing speed:
  ```javascript
  { readConcern: { level: "local" } }
  ```

### 6.3 Caching Strategy

1. **Redis Caching**:
   - Cache user profiles
   - Cache conversation metadata
   - Cache recent messages (last 50) per conversation
   - Cache presence information

2. **TTL Settings**:
   - User profiles: 1 hour
   - Conversation metadata: 15 minutes
   - Recent messages: 5 minutes
   - Presence information: 30 seconds

## 7. Data Migration and Evolution

### 7.1 Schema Versioning

Include a schema version field in each collection to track document structure:

```javascript
{
  _schemaVersion: 1,
  // Other fields...
}
```

### 7.2 Migration Strategies

1. **Lazy Migration**:
   - Update documents when they're accessed
   - Run background processes to gradually migrate old documents

2. **Bulk Migration**:
   - Schedule downtime for major schema changes
   - Use MongoDB's aggregation pipeline for complex transformations

### 7.3 Example Migration Script

```javascript
// Migrate messages to add contentType field
db.messages.find({ contentType: { $exists: false } }).forEach(function(msg) {
  // Determine content type based on existing fields
  let contentType = "text";
  if (msg.attachments && msg.attachments.length > 0) {
    contentType = msg.attachments[0].type;
  }
  
  // Update the document
  db.messages.updateOne(
    { _id: msg._id },
    { 
      $set: { 
        contentType: contentType,
        _schemaVersion: 2
      } 
    }
  );
});
```

## 8. Security Considerations

### 8.1 Access Control

1. **Role-Based Access Control**:
   - Admin role: Full access to all collections
   - Service role: Read/write access to specific collections
   - User role: Access only to their own data

2. **Field-Level Security**:
   - Restrict access to sensitive fields like `passwordHash`

### 8.2 Data Encryption

1. **Encryption at Rest**:
   - Enable MongoDB's storage encryption

2. **Field-Level Encryption**:
   - Encrypt sensitive fields like private messages
   ```javascript
   {
     encryptMetadata: {
       algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
     },
     encryptedFields: {
       content: true
     }
   }
   ```

### 8.3 Auditing

Enable MongoDB's auditing feature to track:
- Authentication attempts
- Authorization failures
- Collection access
- Schema modifications

## 9. Backup and Recovery

### 9.1 Backup Strategy

1. **Full Backups**:
   - Daily full backups using MongoDB's `mongodump`
   - Store backups in secure, off-site location

2. **Incremental Backups**:
   - Hourly oplog backups to capture changes since last full backup

3. **Point-in-Time Recovery**:
   - Configure oplog sizing to allow for sufficient recovery window

### 9.2 Recovery Testing

1. Regularly test restore procedures
2. Validate data integrity after restore
3. Measure recovery time to ensure it meets SLA requirements

## 10. Monitoring and Maintenance

### 10.1 Key Metrics to Monitor

1. **Query Performance**:
   - Slow queries (> 100ms)
   - Index usage
   - Collection scan operations

2. **Database Size**:
   - Overall database size
   - Collection growth rates
   - Index sizes

3. **Connection Metrics**:
   - Connection count
   - Connection duration
   - Connection errors

### 10.2 Regular Maintenance Tasks

1. **Index Optimization**:
   - Review and rebuild fragmented indexes
   - Remove unused indexes

2. **Data Archiving**:
   - Archive old messages to separate collections
   - Implement time-based sharding for historical data

3. **Performance Tuning**:
   - Adjust read/write concerns based on usage patterns
   - Optimize query patterns based on monitoring data