import bcrypt from 'bcryptjs';
import { sqlite, db } from './index.js';
import { users, posts, connections, reports, likes, comments, trustEvents } from './schema.js';
import { calculateUserScores } from '../lib/trustEngine.js';

export async function ensureSchema() {
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT,
      interests TEXT,
      created_at INTEGER NOT NULL,
      trust_score INTEGER NOT NULL DEFAULT 50,
      risk_score INTEGER NOT NULL DEFAULT 10
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL REFERENCES users(id),
      following_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      category TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id),
      reported_user_id TEXT REFERENCES users(id),
      reported_post_id TEXT REFERENCES posts(id),
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS trust_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      event_type TEXT NOT NULL,
      score_change INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

export async function seedDatabase() {
  const passwordHash = await bcrypt.hash('demo123', 10);

  // Clear existing data for demo
  await db.delete(trustEvents).run();
  await db.delete(comments).run();
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
    interests: 'Cybersecurity, Technology, Security',
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
    interests: 'Programming, React, Technology',
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
    interests: 'Crypto, Finance',
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

  // Create posts for trusted user
  const post1 = crypto.randomUUID();
  const post2 = crypto.randomUUID();

  await db.insert(posts).values([
    {
      id: post1,
      authorId: trustedId,
      content: 'Understanding zero-trust architectures is crucial for modern security.',
      category: 'Cybersecurity',
      createdAt: new Date(Date.now() - (20 * 24 * 60 * 60 * 1000)), // 20 days ago
    },
    {
      id: post2,
      authorId: trustedId,
      content: 'Always verify your firewall rules after deployment.',
      category: 'Cybersecurity',
      createdAt: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)), // 5 days ago
    }
  ]);

  // Give likes to the trusted user's posts
  for (let i = 0; i < 10; i++) {
    await db.insert(likes).values({
      id: crypto.randomUUID(),
      postId: i % 2 === 0 ? post1 : post2,
      userId: normalId,
      createdAt: new Date()
    });
  }

  // Normal user posts
  const normalPostId = crypto.randomUUID();
  await db.insert(posts).values([
    {
      id: normalPostId,
      authorId: normalId,
      content: 'Does anyone have good resources for learning React?',
      category: 'Programming',
      createdAt: new Date(Date.now() - (4 * 24 * 60 * 60 * 1000)), // 4 days ago
    },
    {
      id: crypto.randomUUID(),
      authorId: normalId,
      content: 'Just finished my first React tutorial, it was awesome!',
      category: 'Programming',
      createdAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)), // 1 day ago
    }
  ]);

  // Give likes to normal user post
  for (let i = 0; i < 5; i++) {
    await db.insert(likes).values({
      id: crypto.randomUUID(),
      postId: normalPostId,
      userId: trustedId,
      createdAt: new Date()
    });
  }

  // Connections
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
      content: `URGENT: Click here to claim your free Bitcoin! Limit time offer!!!`,
      category: 'Crypto',
      createdAt: new Date(Date.now() - (60000) + i * 1000), // All within 1 minute
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

  // Normal follows Trusted
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
}

export async function initDatabase() {
  await ensureSchema();

  try {
    const existingUsers = await db.select().from(users).all();
    const hasTrusted = existingUsers.some(u => u.username === 'trusted_expert');
    const hasNormal = existingUsers.some(u => u.username === 'normal_student');
    const hasScammer = existingUsers.some(u => u.username === 'sc4mm3r');

    if (!hasTrusted || !hasNormal || !hasScammer) {
      console.log('Demo accounts missing in database. Auto-seeding...');
      await seedDatabase();
      console.log('Database auto-seeded successfully with demo accounts.');
    }
  } catch (err) {
    console.error('Error during auto-seed check:', err);
  }
}
