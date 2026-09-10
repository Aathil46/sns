import express from 'express';
import { db } from '../db/index.js';
import { posts, users, likes, comments, connections } from '../db/schema.js';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { requireAuth } from './auth.js';
import { calculateUserScores } from '../lib/trustEngine.js';

export const recommendationRouter = express.Router();

/**
 * recommendPosts(userId)
 * 1. Collect candidate posts
 * 2. Calculate content relevance
 * 3. Calculate social relevance
 * 4. Obtain author trust
 * 5. Obtain author risk
 * 6. Calculate social proof
 * 7. Apply security penalties
 * 8. Calculate final recommendation score
 * 9. Rank posts
 * 10. Return the personalized feed
 */
recommendationRouter.get('/feed', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    // Fetch current user to get explicit interests
    const currentUser = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const userInterests = (currentUser.interests || '')
      .split(',')
      .map(i => i.trim().toLowerCase())
      .filter(i => i.length > 2); // robust length check

    // 1. Collect candidate posts (top 100 most recent)
    const candidatePosts = await db
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
      .limit(100)
      .all();

    const postIds = candidatePosts.map(p => p.post.id);

    // Make sure author trust and risk scores are up-to-date for ranking
    const uniqueAuthorIds = Array.from(new Set(candidatePosts.map(p => p.author.id)));
    const liveScores = new Map();
    for (const authorId of uniqueAuthorIds) {
      // calculates and persists in DB, ensuring fresh telemetry
      const scores = await calculateUserScores(authorId);
      liveScores.set(authorId, scores);
    }

    // Fetch user connections
    const userConnections = await db
      .select()
      .from(connections)
      .where(and(eq(connections.followerId, userId), eq(connections.status, 'accepted')))
      .all();
    const connectedUserIds = new Set(userConnections.map(c => c.followingId));

    // Fetch engagement stats for these posts
    let postEngagement = new Map(); // postId -> { likes: 0, comments: 0 }
    postIds.forEach(id => postEngagement.set(id, { likes: 0, comments: 0 }));

    if (postIds.length > 0) {
      const allLikes = await db.select().from(likes).where(inArray(likes.postId, postIds)).all();
      const allComments = await db.select().from(comments).where(inArray(comments.postId, postIds)).all();

      allLikes.forEach(l => {
        const entry = postEngagement.get(l.postId);
        if (entry) entry.likes += 1;
      });
      allComments.forEach(c => {
        const entry = postEngagement.get(c.postId);
        if (entry) entry.comments += 1;
      });
    }

    const scoredPosts = candidatePosts.map(item => {
      // Use Live Scores
      const authorLiveScores = liveScores.get(item.author.id);
      if (authorLiveScores) {
        item.author.trustScore = authorLiveScores.trustScore;
        item.author.riskScore = authorLiveScores.riskScore;
      }

      // 2. Relevance Score (0-1)
      const postCategory = (item.post.category || '').toLowerCase();
      let relevanceScore = 0.2; // Base relevance

      // strict word match to avoid false positives (e.g. "tech" in "technology" is fine, but "a" in "category" is bad)
      if (postCategory.length > 2 && userInterests.some(interest => postCategory.includes(interest) || interest.includes(postCategory))) {
        relevanceScore = 1.0;
      }

      // 3. Social Score (0-1)
      const isConnected = connectedUserIds.has(item.author.id);
      const isSelf = item.author.id === userId;
      const socialScore = isConnected || isSelf ? 1.0 : 0.2;

      // 4. Trust Score (Normalized 0-1)
      const trustScore = item.author.trustScore / 100;

      // 5. Risk Score
      const riskScore = item.author.riskScore / 100;

      // 6. Engagement Quality (0-1)
      const stats = postEngagement.get(item.post.id) || { likes: 0, comments: 0 };
      // Arbitrary weight: 1 like = 1 point, 1 comment = 2 points. 10 points = 1.0 (max)
      const engagementPoints = stats.likes * 1 + stats.comments * 2;
      const engagementQuality = Math.min(1.0, engagementPoints / 10);

      // 7. Security Penalty
      let riskPenalty = riskScore * 0.5;
      if (riskScore > 0.7 && trustScore < 0.3) {
        riskPenalty += 0.5;
      }

      // 8. Calculate final recommendation score
      let finalScore =
        (0.40 * relevanceScore) +
        (0.25 * trustScore) +
        (0.20 * socialScore) +
        (0.15 * engagementQuality) -
        riskPenalty;

      // Generate Explanation securely matching factors
      const explanation = [];
      if (relevanceScore === 1.0) explanation.push(`Matches your interest in ${item.post.category}`);
      if (trustScore >= 0.7) explanation.push("Author has a high trust score");
      if (isConnected && !isSelf) explanation.push("Author is in your connections");
      if (isSelf) explanation.push("Your own post");
      if (engagementQuality >= 0.5) explanation.push("High community engagement");
      if (riskScore > 0.7) explanation.push("Warning: Elevated security risk indicators");

      // Fallback if none trigger
      if (explanation.length === 0 && riskScore <= 0.7) explanation.push("General feed recommendation");

      return {
        ...item,
        scores: {
          relevanceScore,
          socialScore,
          trustScore,
          engagementQuality,
          riskPenalty,
          finalScore
        },
        explanation
      };
    });

    // 9. Rank posts
    scoredPosts.sort((a, b) => b.scores.finalScore - a.scores.finalScore);

    // 10. Return the personalized feed
    res.json({ feed: scoredPosts });
  } catch (err: any) {
    console.error("Recommendation feed error:", err);
    res.status(500).json({ error: err.message });
  }
});
