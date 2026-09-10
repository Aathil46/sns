import express from 'express';
import { requireAuth } from './auth.js';
import { calculateUserScores } from '../lib/trustEngine.js';
import { db } from '../db/index.js';
import { reports, users, posts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export const trustRouter = express.Router();

// Harden POST /api/trust/report
trustRouter.post('/report', requireAuth, async (req: any, res: any) => {
  try {
    const { reportedUserId, reportedPostId, reason } = req.body;

    // Validate reason input
    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!trimmedReason || trimmedReason.length < 3 || trimmedReason.length > 300) {
      return res.status(400).json({ error: 'Report reason must be between 3 and 300 characters.' });
    }

    let targetUserId = reportedUserId;
    let targetPostId = reportedPostId || null;

    // Validate reported post if provided
    if (targetPostId) {
      const post = await db.select().from(posts).where(eq(posts.id, targetPostId)).get();
      if (!post) {
        return res.status(404).json({ error: 'Reported post not found.' });
      }
      // Authoritative author ID from the post itself
      targetUserId = post.authorId;
    }

    // Validate reported user exists
    if (!targetUserId) {
      return res.status(400).json({ error: 'A target user or post is required.' });
    }

    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).get();
    if (!targetUser) {
      return res.status(404).json({ error: 'Reported user not found.' });
    }

    // Prevent self-reporting
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'You cannot report yourself or your own content.' });
    }

    // Prevent duplicate reports from the same user against the same target
    const existingReport = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, req.userId),
          targetPostId
            ? eq(reports.reportedPostId, targetPostId)
            : eq(reports.reportedUserId, targetUserId)
        )
      )
      .get();

    if (existingReport) {
      return res.status(409).json({ error: 'You have already submitted a report for this target.' });
    }

    await db.insert(reports).values({
      id: crypto.randomUUID(),
      reporterId: req.userId,
      reportedUserId: targetUserId,
      reportedPostId: targetPostId,
      reason: trimmedReason,
      status: 'pending',
      createdAt: new Date()
    });

    // Run server-side trust/risk recalculation
    await calculateUserScores(targetUserId);

    res.json({ success: true, message: 'Report submitted successfully.' });
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

// User trust endpoint: returns full private telemetry only to the owner, public summary to others
trustRouter.get('/:userId', requireAuth, async (req: any, res: any) => {
  try {
    const targetUserId = req.params.userId;
    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).get();
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const scores = await calculateUserScores(targetUserId);

    // If viewing own profile, return full telemetry
    if (targetUserId === req.userId) {
      return res.json(scores);
    }

    // For other users, return only public trust summary (strip private reports, negative factors, and events)
    return res.json({
      trustScore: scores.trustScore,
      trustLevel: scores.trustLevel,
      riskLevel: scores.riskLevel,
      positiveFactors: scores.positiveFactors,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
