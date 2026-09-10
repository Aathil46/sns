import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // We'll use UUIDs or string IDs
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  bio: text('bio'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  trustScore: integer('trust_score').default(50).notNull(), // 0-100
  riskScore: integer('risk_score').default(10).notNull(), // 0-100
});

export const connections = sqliteTable('connections', {
  id: text('id').primaryKey(),
  followerId: text('follower_id').notNull().references(() => users.id),
  followingId: text('following_id').notNull().references(() => users.id),
  status: text('status').notNull(), // 'accepted', 'pending'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const likes = sqliteTable('likes', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').notNull().references(() => users.id),
  reportedUserId: text('reported_user_id').references(() => users.id),
  reportedPostId: text('reported_post_id').references(() => posts.id),
  reason: text('reason').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const trustEvents = sqliteTable('trust_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  eventType: text('event_type').notNull(),
  scoreChange: integer('score_change').notNull(),
  description: text('description').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
