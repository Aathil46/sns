import express from 'express';
import { requireAuth } from './auth.js';
import { calculateUserScores } from '../lib/trustEngine.js';

export const trustRouter = express.Router();

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
