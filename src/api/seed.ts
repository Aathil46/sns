import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, posts, connections } from '../db/schema.js';

export const seedRouter = express.Router();

seedRouter.post('/run', async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('demo123', 10);
    
    // Clear existing data for demo
    await db.delete(connections).run();
    await db.delete(posts).run();
    await db.delete(users).run();

    // 1. Trusted User (Trust: 91, Risk: 5)
    const trustedId = crypto.randomUUID();
    await db.insert(users).values({
      id: trustedId,
      username: 'trusted_expert',
      name: 'Alice Expert',
      passwordHash,
      bio: 'Cybersecurity professional.',
      createdAt: new Date(Date.now() - 100000000),
      trustScore: 91,
      riskScore: 5
    });

    // 2. Normal User (Trust: 70, Risk: 20)
    const normalId = crypto.randomUUID();
    await db.insert(users).values({
      id: normalId,
      username: 'normal_student',
      name: 'Bob Student',
      passwordHash,
      bio: 'Just learning about networks.',
      createdAt: new Date(),
      trustScore: 70,
      riskScore: 20
    });

    // 3. Suspicious User (Trust: 25, Risk: 85)
    const suspiciousId = crypto.randomUUID();
    await db.insert(users).values({
      id: suspiciousId,
      username: 'sc4mm3r',
      name: 'Free Crypto',
      passwordHash,
      bio: 'Click my link for money',
      createdAt: new Date(),
      trustScore: 25,
      riskScore: 85
    });

    // Create some posts
    await db.insert(posts).values([
      {
        id: crypto.randomUUID(),
        authorId: trustedId,
        content: 'Understanding zero-trust architectures is crucial for modern security.',
        category: 'Cybersecurity',
        createdAt: new Date(Date.now() - 50000),
      },
      {
        id: crypto.randomUUID(),
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
      {
        id: crypto.randomUUID(),
        authorId: suspiciousId,
        content: 'URGENT: Click here to claim your free Bitcoin! Limit time offer!!!',
        category: 'Crypto',
        createdAt: new Date(Date.now() - 5000),
      }
    ]);

    // Create connection: Normal follows Trusted
    await db.insert(connections).values({
      id: crypto.randomUUID(),
      followerId: normalId,
      followingId: trustedId,
      status: 'accepted',
      createdAt: new Date()
    });

    res.json({ success: true, message: 'Database seeded with demo scenario.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
