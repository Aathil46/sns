import express from 'express';
import { db } from '../db/index.js';
import { posts, users, likes, comments } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAuth } from './auth.js';

export const postsRouter = express.Router();

// Create a post
postsRouter.post('/', requireAuth, async (req: any, res: any) => {
  try {
    const { content, category } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const id = crypto.randomUUID();
    await db.insert(posts).values({
      id,
      authorId: req.userId,
      content,
      category,
      createdAt: new Date(),
    });

    res.json({ success: true, post: { id, content, category } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Simple Feed (before recommendation engine)
postsRouter.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const feed = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          username: users.username,
          name: users.name,
          trustScore: users.trustScore,
          riskScore: users.riskScore
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(50)
      .all();

    res.json({ posts: feed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
