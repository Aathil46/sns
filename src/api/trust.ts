import express from 'express';
import { requireAuth } from './auth.js';
import { calculateUserScores } from '../lib/trustEngine.js';
import { db } from '../db/index.js';
import { reports } from '../db/schema.js';
import crypto from 'crypto';

export const trustRouter = express.Router();

trustRouter.post('/report', requireAuth, async (req: any, res: any) => {
  try {
    const { reportedUserId, reportedPostId, reason } = req.body;
    await db.insert(reports).values({
      id: crypto.randomUUID(),
      reporterId: req.userId,
      reportedUserId,
      reportedPostId,
      reason: reason || 'Suspicious Activity',
      status: 'pending',
      createdAt: new Date()
    });
    // Immediately trigger a background recalculation
    calculateUserScores(reportedUserId).catch(console.error);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

trustRouter.get('/me', requireAuth, async (req: any, res: any) => {
  try {
    const scores = await calculateUserScores(req.userId);
    res.json(scores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

trustRouter.post('/recalculate', requireAuth, async (req: any, res: any) => {
  try {
    const scores = await calculateUserScores(req.userId);
    res.json({ success: true, scores });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin-only or restricted route in a real app
trustRouter.get('/:userId', requireAuth, async (req: any, res: any) => {
  try {
    const scores = await calculateUserScores(req.params.userId);
    res.json(scores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
