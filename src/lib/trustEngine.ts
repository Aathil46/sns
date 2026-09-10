import { db } from '../db/index.js';
import { users, posts, likes, comments, connections, reports, trustEvents } from '../db/schema.js';
import { eq, sql, and, count } from 'drizzle-orm';

const TRUST_WEIGHTS = {
  accountReliability: 0.15,
  profileCompleteness: 0.15,
  socialTrust: 0.25,
  positiveInteractions: 0.20,
  behavioralConsistency: 0.15,
  communityFeedback: 0.10,
};

export async function calculateUserScores(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error('User not found');

  // --- 1. Account Reliability (0-100) ---
  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
  // Cap at 30 days for 100 score
  let accountReliability = Math.min(100, (accountAgeDays / 30) * 100);

  // --- 2. Profile Completeness (0-100) ---
  let profileCompleteness = 0;
  if (user.username) profileCompleteness += 25;
  if (user.name) profileCompleteness += 25;
  if (user.bio && user.bio.length > 10) profileCompleteness += 50;

  // --- 3. Social Trust (0-100) ---
  const followerRecords = await db
    .select({ followerTrust: users.trustScore })
    .from(connections)
    .innerJoin(users, eq(connections.followerId, users.id))
    .where(and(eq(connections.followingId, userId), eq(connections.status, 'accepted')))
    .all();

  const followersCount = followerRecords.length;
  let socialTrust = 0;
  
  if (followersCount > 0) {
    const totalTrust = followerRecords.reduce((sum, record) => sum + (record.followerTrust || 0), 0);
    const averageTrust = totalTrust / followersCount;
    // Base weight by follower count (up to 5), scaled by their average trust
    socialTrust = Math.min(100, (followersCount / 5) * averageTrust);
  }

  // --- 4. Positive Interactions (0-100) ---
  // Count likes received on their posts
  const userPosts = await db.select({ id: posts.id, createdAt: posts.createdAt }).from(posts).where(eq(posts.authorId, userId)).all();
  const postIds = userPosts.map(p => p.id);
  
  let likesReceived = 0;
  let commentsReceived = 0;

  if (postIds.length > 0) {
    const likesRes = await db.select({ count: count() })
      .from(likes)
      .where(sql`${likes.postId} IN ${postIds}`)
      .get();
    likesReceived = likesRes?.count || 0;

    const commentsRes = await db.select({ count: count() })
      .from(comments)
      .where(sql`${comments.postId} IN ${postIds}`)
      .get();
    commentsReceived = commentsRes?.count || 0;
  }

  const interactions = likesReceived + commentsReceived;
  // 10 positive interactions = 100
  let positiveInteractions = Math.min(100, (interactions / 10) * 100);

  // --- 5. Behavioral Consistency (0-100) ---
  // Metric: Posts spread out over time. 
  let behavioralConsistency = 0;
  if (userPosts.length > 1) {
    const times = userPosts.map(p => new Date(p.createdAt).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const spanDays = (maxTime - minTime) / (1000 * 60 * 60 * 24);
    
    // 7 days of spread = 100 consistency
    behavioralConsistency = Math.min(100, (spanDays / 7) * 100); 
  } else if (userPosts.length === 1) {
    behavioralConsistency = 20; // minimal baseline for a single post
  }

  // --- 6. Community Feedback (0-100) ---
  // 100 means no reports. Reports decrease this score.
  const reportsRes = await db.select({ count: count() }).from(reports).where(eq(reports.reportedUserId, userId)).get();
  const reportsCount = reportsRes?.count || 0;
  let communityFeedback = Math.max(0, 100 - (reportsCount * 33)); // 3 reports = 0 score

  // Calculate Final Trust Score
  const trustScoreRaw = 
    (accountReliability * TRUST_WEIGHTS.accountReliability) +
    (profileCompleteness * TRUST_WEIGHTS.profileCompleteness) +
    (socialTrust * TRUST_WEIGHTS.socialTrust) +
    (positiveInteractions * TRUST_WEIGHTS.positiveInteractions) +
    (behavioralConsistency * TRUST_WEIGHTS.behavioralConsistency) +
    (communityFeedback * TRUST_WEIGHTS.communityFeedback);

  const trustScore = Math.round(trustScoreRaw);

  // Calculate Risk Score
  let riskScore = 0;
  
  // Risk 1: New account (< 1 day)
  if (accountAgeDays < 1) riskScore += 20;

  // Risk 2: High reports
  if (reportsCount > 0) riskScore += (reportsCount * 25);

  // Risk 3: Spam-like posting frequency (e.g., lots of posts in a short time)
  // For simplicity, > 10 posts = +20 risk, > 20 posts = +40 risk
  if (userPosts.length > 10) riskScore += 20;
  if (userPosts.length > 20) riskScore += 20;

  riskScore = Math.min(100, riskScore);

  // Generate Trust Explanations
  const positiveFactors = [];
  const negativeFactors = [];

  if (accountReliability > 80) positiveFactors.push("Established account history");
  else if (accountReliability < 20) negativeFactors.push("Very new account");

  if (profileCompleteness === 100) positiveFactors.push("Complete profile");

  if (socialTrust > 50) positiveFactors.push("Connected to highly trusted users");
  else if (socialTrust === 0) negativeFactors.push("Lacks trusted connections");

  if (positiveInteractions > 50) positiveFactors.push("High positive engagement");
  
  if (behavioralConsistency > 50) positiveFactors.push("Consistent activity over time");
  else if (behavioralConsistency < 20 && userPosts.length > 5) negativeFactors.push("Erratic burst of activity");

  if (communityFeedback < 100) negativeFactors.push(`${reportsCount} report(s) received`);

  // Generate Risk Explanations
  const riskFactors = [];
  if (accountAgeDays < 1) riskFactors.push("Account is newly created");
  if (reportsCount > 0) riskFactors.push("Multiple community reports");
  if (userPosts.length > 10) riskFactors.push("High posting volume");

  if (riskFactors.length === 0) riskFactors.push("No significant risk signals");

  // Determine Levels
  const getTrustLevel = (score: number) => {
    if (score <= 30) return "LOW TRUST";
    if (score <= 70) return "MEDIUM TRUST";
    return "HIGH TRUST";
  };

  const getRiskLevel = (score: number) => {
    if (score <= 30) return "LOW RISK";
    if (score <= 70) return "MEDIUM RISK";
    return "HIGH RISK";
  };

  const result = {
    trustScore,
    trustLevel: getTrustLevel(trustScore),
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    positiveFactors,
    negativeFactors,
    riskFactors
  };

  // Optionally, persist these scores to the DB
  await db.update(users).set({
    trustScore: result.trustScore,
    riskScore: result.riskScore
  }).where(eq(users.id, userId));

  return result;
}
