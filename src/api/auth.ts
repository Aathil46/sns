import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is strictly required for security.');
}

authRouter.post('/register', async (req, res) => {
  try {
    const { username, name, password } = req.body;
    if (!username || !name || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existingUser = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUser) {
      return res.status(400).json({ error: 'Username taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await db.insert(users).values({
      id,
      username,
      name,
      passwordHash,
      createdAt: new Date(),
    });

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true, user: { id, username, name } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await db.select().from(users).where(eq(users.username, username)).get();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true, user: { id: user.id, username: user.username, name: user.name } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Middleware to verify auth
export const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

authRouter.get('/me', requireAuth, async (req: any, res: any) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.userId)).get();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Omit password hash
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
