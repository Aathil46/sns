import express from 'express';
import { db } from '../db/index.js';
import { posts, users, likes, comments, connections } from '../db/schema.js';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { requireAuth } from './auth.js';

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

    // 1. Collect candidate posts (top 100 most recent for performance)
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

    // Fetch user connections
    const userConnections = await db
      .select()
      .from(connections)
      .where(and(eq(connections.followerId, userId), eq(connections.status, 'accepted')))
      .all();
    const connectedUserIds = new Set(userConnections.map(c => c.followingId));

    const scoredPosts = candidatePosts.map(item => {
      // 2. Relevance Score (Stub: randomly assigned or basic keyword matching for now)
      // In a real scenario, compare post.category/content with user interests
      const relevanceScore = 0.5; // Neutral relevance

      // 3. Social Score
      // Are they connected?
      const isConnected = connectedUserIds.has(item.author.id);
      const socialScore = isConnected ? 1.0 : 0.2;

      // 4. Trust Score (Normalized 0-1)
      const trustScore = item.author.trustScore / 100;

      // 5. Risk Score
      const riskScore = item.author.riskScore / 100;

      // 6. Engagement Quality (stub)
      const engagementQuality = 0.5; 

      // 7. Security Penalty
      // If risk is high (>0.7) and trust is low (<0.3), massive penalty
      let riskPenalty = riskScore * 0.5;
      if (riskScore > 0.7 && trustScore < 0.3) {
        riskPenalty += 0.5;
      }

      // 8. Calculate final recommendation score
      // FinalScore = 0.40 * RelevanceScore + 0.25 * TrustScore + 0.20 * SocialScore + 0.15 * EngagementQuality - RiskPenalty
      let finalScore = 
        (0.40 * relevanceScore) +
        (0.25 * trustScore) +
        (0.20 * socialScore) +
        (0.15 * engagementQuality) -
        riskPenalty;

      // Generate Explanation
      const explanation = [];
      if (relevanceScore >= 0.5) explanation.push("Matches your interests");
      if (trustScore > 0.7) explanation.push("Author has a high trust score");
      if (isConnected) explanation.push("Author is in your connections");
      if (riskScore < 0.3) explanation.push("Low security risk");
      if (riskScore > 0.7) explanation.push("Warning: Elevated security risk indicators");

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
