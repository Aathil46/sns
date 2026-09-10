import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, posts, connections, reports, likes } from '../db/schema.js';
import { calculateUserScores } from '../lib/trustEngine.js';

export const seedRouter = express.Router();

seedRouter.post('/run', async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('demo123', 10);
    
    // Clear existing data for demo
    await db.delete(reports).run();
    await db.delete(likes).run();
    await db.delete(connections).run();
    await db.delete(posts).run();
    await db.delete(users).run();

    // 1. Trusted User (Goal: High Trust, Low Risk)
    const trustedId = crypto.randomUUID();
    await db.insert(users).values({
      id: trustedId,
      username: 'trusted_expert',
      name: 'Alice Expert',
      passwordHash,
      bio: 'Cybersecurity professional with 10 years of experience.',
      createdAt: new Date(Date.now() - (40 * 24 * 60 * 60 * 1000)), // 40 days ago
    });

    // 2. Normal User (Goal: Medium Trust, Low Risk)
    const normalId = crypto.randomUUID();
    await db.insert(users).values({
      id: normalId,
      username: 'normal_student',
      name: 'Bob Student',
      passwordHash,
      bio: 'Just learning about networks.',
      createdAt: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)), // 5 days ago
    });

    // 3. Suspicious User (Goal: Low Trust, High Risk)
    const suspiciousId = crypto.randomUUID();
    await db.insert(users).values({
      id: suspiciousId,
      username: 'sc4mm3r',
      name: 'Free Crypto',
      passwordHash,
      bio: 'Click my link for money',
      createdAt: new Date(), // Just now
    });

    // Create 5 dummy users to follow the trusted user
    for (let i = 0; i < 5; i++) {
      const dummyId = crypto.randomUUID();
      await db.insert(users).values({
        id: dummyId,
        username: `dummy_${i}`,
        name: `Dummy ${i}`,
        passwordHash,
        bio: '',
        createdAt: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)),
      });
      await db.insert(connections).values({
        id: crypto.randomUUID(),
        followerId: dummyId,
        followingId: trustedId,
        status: 'accepted',
        createdAt: new Date()
      });
    }

    // Create some posts
    const post1 = crypto.randomUUID();
    const post2 = crypto.randomUUID();
    
    await db.insert(posts).values([
      {
        id: post1,
        authorId: trustedId,
        content: 'Understanding zero-trust architectures is crucial for modern security.',
        category: 'Cybersecurity',
        createdAt: new Date(Date.now() - 50000),
      },
      {
        id: post2,
        authorId: trustedId,
        content: 'Always verify your firewall rules after deployment.',
        category: 'Cybersecurity',
        createdAt: new Date(Date.now() - 10000),
      },
      {
        id: crypto.randomUUID(),
        authorId: normalId,
        content: 'Does anyone have good resources for learning React?',
        category: 'Programming',
        createdAt: new Date(Date.now() - 20000),
      },
    ]);

    // Give some likes to the trusted user's posts
    for (let i = 0; i < 10; i++) {
      await db.insert(likes).values({
        id: crypto.randomUUID(),
        postId: i % 2 === 0 ? post1 : post2,
        userId: normalId, // Doesn't matter who liked it
        createdAt: new Date()
      });
    }

    const normalPostId = crypto.randomUUID();
    await db.insert(posts).values({
      id: normalPostId,
      authorId: normalId,
      content: 'Does anyone have good resources for learning React?',
      category: 'Programming',
      createdAt: new Date(Date.now() - 20000),
    });

    // Give some likes to the normal user's post
    for (let i = 0; i < 5; i++) {
      await db.insert(likes).values({
        id: crypto.randomUUID(),
        postId: normalPostId,
        userId: trustedId, 
        createdAt: new Date()
      });
    }

    // Give normal user a follower
    await db.insert(connections).values({
      id: crypto.randomUUID(),
      followerId: trustedId,
      followingId: normalId,
      status: 'accepted',
      createdAt: new Date()
    });

    // Suspicious user spamming posts
    for (let i = 0; i < 15; i++) {
      await db.insert(posts).values({
        id: crypto.randomUUID(),
        authorId: suspiciousId,
        content: `URGENT: Click here to claim your free Bitcoin! Limit time offer!!! ${i}`,
        category: 'Crypto',
        createdAt: new Date(Date.now() - 5000),
      });
    }

    // Reports against suspicious user
    for (let i = 0; i < 3; i++) {
      await db.insert(reports).values({
        id: crypto.randomUUID(),
        reporterId: trustedId,
        reportedUserId: suspiciousId,
        reason: 'Spam',
        status: 'pending',
        createdAt: new Date()
      });
    }

    // Create connection: Normal follows Trusted
    await db.insert(connections).values({
      id: crypto.randomUUID(),
      followerId: normalId,
      followingId: trustedId,
      status: 'accepted',
      createdAt: new Date()
    });

    // Recalculate scores for the 3 main users
    await calculateUserScores(trustedId);
    await calculateUserScores(normalId);
    await calculateUserScores(suspiciousId);

    res.json({ success: true, message: 'Database seeded with behavioral scenario and scores calculated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
