# Notification System Design

## Stage 1: System Architecture

### Overview
A campus notification platform delivering real-time updates for Placements, Events, and Results to students.

### Components
- **API Gateway**: Routes incoming requests
- **Notification Service**: Core service that creates and manages notifications
- **Message Queue (Redis/RabbitMQ)**: Decouples notification sending from creation
- **Database (PostgreSQL)**: Stores notifications with studentID, type, message, isRead, createdAt
- **Email Service**: Sends email notifications
- **WebSocket Server**: Pushes real-time in-app notifications

### Flow
1. HR/Admin triggers notification
2. Notification Service saves to DB
3. Message pushed to queue
4. Workers consume queue and send email + in-app notification simultaneously

---

## Stage 3: SQL Analysis

### Original Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

### Is the query correct?
Yes, the query is logically correct.

### Why is it slow?
With 50,000 students and 5,000,000 notifications, there is no index on studentID, isRead, or createdAt. Full table scan happens every time.

### Fix
```sql
CREATE INDEX idx_student_unread ON notifications(studentID, isRead, createdAt DESC);
```

### Is indexing every column a good idea?
No. Indexes on every column waste storage, slow down INSERT/UPDATE operations, and the query optimizer gets confused. Only index columns used in WHERE, ORDER BY, or JOIN clauses.

### Query for placement notifications in last 7 days
```sql
SELECT * FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;
```

---

## Stage 4: DB Overwhelm on Page Load

### Problem
Every page load fires a DB query for every student — no caching, no pagination.

### Solutions

1. **Pagination**: Fetch only 10-20 notifications per page using LIMIT/OFFSET or cursor-based pagination. Reduces query load drastically.

2. **Redis Caching**: Cache unread notifications per student in Redis with a TTL of 60 seconds. On page load, check cache first. Only hit DB on cache miss or after new notification arrives.

3. **Tradeoffs**:
   - Pagination: Simple to implement, but user must scroll/click for more
   - Redis: Fast, but adds infrastructure complexity and cache invalidation logic needed when new notifications arrive

---

## Stage 5: Fix notify_all

### Problems with current implementation
1. Sequential loop — sending 50,000 emails one by one is extremely slow
2. If send_email fails midway (e.g. at student 200), remaining students get nothing and there is no retry
3. No atomicity — email and DB save are not coordinated. Email can succeed but DB save fails or vice versa

### Should email and DB save happen together?
Yes, use a message queue. Save to DB first, then enqueue the email job. The queue worker sends the email and retries on failure. This guarantees at-least-once delivery.

### Revised pseudocode