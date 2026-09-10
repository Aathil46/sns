import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Info,
  MessageSquare,
  Flag,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Send,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';

type Post = {
  post: {
    id: string;
    content: string;
    category: string;
    createdAt: string;
  };
  author: {
    id: string;
    username: string;
    name: string;
    trustScore: number;
    riskScore: number;
  };
  scores: {
    relevanceScore: number;
    socialScore: number;
    trustScore: number;
    engagementQuality: number;
    riskPenalty: number;
    finalScore: number;
  };
  explanation: string[];
};

export default function Home() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [category, setCategory] = useState('General');

  // Reporting Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState('Spam or automated posting');
  const [customReason, setCustomReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportNotification, setReportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recommendations/feed');
      const data = await res.json();
      if (data.feed) setFeed(data.feed);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost.trim(), category })
      });
      if (res.ok) {
        setNewPost('');
        await fetchFeed();
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setPosting(false);
    }
  };

  const openReportModal = (item: Post) => {
    setReportingPost(item);
    setReportReason('Spam or automated posting');
    setCustomReason('');
    setReportNotification(null);
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost || submittingReport) return;

    const finalReason = reportReason === 'Other' ? customReason.trim() : reportReason;
    if (!finalReason || finalReason.length < 3) {
      setReportNotification({ type: 'error', message: 'Please provide a valid reason (at least 3 characters).' });
      return;
    }

    setSubmittingReport(true);
    setReportNotification(null);

    try {
      const res = await fetch('/api/trust/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: reportingPost.author.id,
          reportedPostId: reportingPost.post.id,
          reason: finalReason
        })
      });

      const data = await res.json();

      if (res.ok) {
        setReportNotification({ type: 'success', message: 'Report received. Trust and Risk scores updated.' });
        setTimeout(() => {
          setReportModalOpen(false);
          fetchFeed();
        }, 1400);
      } else {
        setReportNotification({ type: 'error', message: data.error || 'Failed to submit report.' });
      }
    } catch (err) {
      setReportNotification({ type: 'error', message: 'Network error submitting report.' });
    } finally {
      setSubmittingReport(false);
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'cybersecurity':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'programming':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'technology':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'crypto':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      {/* Feed Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Trust-Aware Recommendation Feed
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Posts ranked using: <span className="font-semibold text-slate-700">0.40 × Relevance + 0.25 × Trust + 0.20 × Social + 0.15 × Engagement − Risk Penalty</span>
            </p>
          </div>
          <button
            onClick={fetchFeed}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Create Post Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span>Share with the network</span>
        </div>
        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none resize-none text-sm transition-all"
            rows={3}
            maxLength={500}
            placeholder="What's happening? Share research, updates, or questions..."
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label htmlFor="category-select" className="text-xs font-medium text-slate-500">Category:</label>
              <select
                id="category-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="General">General</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Programming">Programming</option>
                <option value="Crypto">Crypto</option>
                <option value="Technology">Technology</option>
              </select>
              <span className="text-[11px] text-slate-400 ml-2">{newPost.length}/500</span>
            </div>
            <button
              type="submit"
              disabled={!newPost.trim() || posting}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {posting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Post Content
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-slate-200 rounded" />
                    <div className="w-20 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="w-full h-3 bg-slate-100 rounded" />
                <div className="w-3/4 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed Posts */}
      {!loading && (
        <div className="space-y-5">
          {feed.map((item) => {
            const { post, author, scores, explanation } = item;
            const isAuthorHighTrust = author.trustScore >= 70;
            const isAuthorMedTrust = author.trustScore > 30 && author.trustScore < 70;
            const isAuthorLowTrust = author.trustScore <= 30;
            const isAuthorHighRisk = author.riskScore >= 70;
            const isAuthorMedRisk = author.riskScore > 30 && author.riskScore < 70;
            const isSelf = user?.id === author.id;

            return (
              <article
                key={post.id}
                className={`bg-white p-6 rounded-2xl border transition-all shadow-xs space-y-4 ${
                  isAuthorHighRisk
                    ? 'border-rose-200/80 bg-gradient-to-b from-rose-50/20 to-white'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Header: Author, Badges, Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                      isAuthorHighRisk
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : isAuthorHighTrust
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {author.name ? author.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{author.name}</span>
                        <span className="text-xs font-normal text-slate-500">@{author.username}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(post.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${getCategoryBadgeColor(post.category || 'General')}`}>
                          {post.category || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trust & Risk Badges */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {isAuthorHighTrust && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold rounded-lg shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5" /> High Trust ({author.trustScore})
                      </span>
                    )}
                    {isAuthorMedTrust && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-medium rounded-lg">
                        <Shield className="w-3.5 h-3.5" /> Med Trust ({author.trustScore})
                      </span>
                    )}
                    {isAuthorLowTrust && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium rounded-lg">
                        <Shield className="w-3.5 h-3.5" /> Low Trust ({author.trustScore})
                      </span>
                    )}

                    {isAuthorHighRisk && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold rounded-lg shadow-2xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> High Risk ({author.riskScore})
                      </span>
                    )}
                    {isAuthorMedRisk && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium rounded-lg">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Med Risk ({author.riskScore})
                      </span>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap font-normal">
                  {post.content}
                </p>

                {/* High Risk Warning Banner */}
                {isAuthorHighRisk && (
                  <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-xs text-rose-900 leading-snug">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Security Alert:</span> Unusual or high-risk behavior detected for this author. Algorithmic ranking penalty applied.
                      </div>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => openReportModal(item)}
                        className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-white text-rose-700 border border-rose-300 rounded-lg shadow-2xs hover:bg-rose-100/50 transition-colors"
                      >
                        Report Account
                      </button>
                    )}
                  </div>
                )}

                {/* "Why am I seeing this?" Algorithmic Explainability Card */}
                <details className="bg-slate-50/80 rounded-xl border border-slate-200/70 group overflow-hidden">
                  <summary className="px-4 py-3 flex items-center justify-between cursor-pointer list-none select-none hover:bg-slate-100/60 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Why am I seeing this?</span>
                      <span className="text-[11px] font-normal text-slate-400">• Algorithmic Ranking Breakdown</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 px-2 py-0.5 bg-white rounded border border-slate-200 shadow-2xs">
                        Score: {scores.finalScore.toFixed(3)}
                      </span>
                      <span className="text-slate-400 text-xs transition-transform duration-200 group-open:rotate-180">▼</span>
                    </div>
                  </summary>

                  <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 space-y-4">
                    {/* Active Explanation Factors */}
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Contributing Factors:</div>
                      <ul className="space-y-1.5">
                        {explanation.map((reason, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 5-Component Normalized Factor Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      {/* Relevance (40%) */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Relevance (40%)</div>
                        <div className="text-sm font-bold text-blue-700 mt-0.5">{(scores.relevanceScore * 0.40).toFixed(3)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Raw: {scores.relevanceScore.toFixed(2)}</div>
                      </div>

                      {/* Trust (25%) */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Trust (25%)</div>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">{(scores.trustScore * 0.25).toFixed(3)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Raw: {scores.trustScore.toFixed(2)}</div>
                      </div>

                      {/* Social (20%) */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Social (20%)</div>
                        <div className="text-sm font-bold text-indigo-700 mt-0.5">{(scores.socialScore * 0.20).toFixed(3)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Raw: {scores.socialScore.toFixed(2)}</div>
                      </div>

                      {/* Engagement (15%) */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Engage (15%)</div>
                        <div className="text-sm font-bold text-amber-700 mt-0.5">{(scores.engagementQuality * 0.15).toFixed(3)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Raw: {scores.engagementQuality.toFixed(2)}</div>
                      </div>

                      {/* Risk Penalty */}
                      <div className="p-2.5 bg-rose-50/80 rounded-lg border border-rose-200/80 shadow-2xs">
                        <div className="text-[10px] font-medium text-rose-500 uppercase tracking-wider">Risk Penalty</div>
                        <div className="text-sm font-bold text-rose-700 mt-0.5">−{scores.riskPenalty.toFixed(3)}</div>
                        <div className="text-[10px] text-rose-400 mt-0.5">Author Risk: {(scores.riskPenalty > 0 ? (item.author.riskScore) : 0)}/100</div>
                      </div>
                    </div>

                    {/* Formula Explanation Callout */}
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Formula: Final = (0.40 × Rel) + (0.25 × Trust) + (0.20 × Soc) + (0.15 × Eng) − Penalty</span>
                      <span className="font-bold text-slate-800">Final Rank = {scores.finalScore.toFixed(3)}</span>
                    </div>
                  </div>
                </details>

                {/* Footer Actions: Comment & Report */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Discussion feature placeholder for demo"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Discussion</span>
                    </button>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => openReportModal(item)}
                      className="flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Report suspicious content to Trust Engine"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          {feed.length === 0 && (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No posts in feed yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Seed the database with academic sample users or create the first post above to observe the recommendation engine in action.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Universal Report Modal */}
      {reportModalOpen && reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Report Content</h3>
                  <p className="text-[11px] text-slate-500">Flag for algorithmic trust & risk review</p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Target Author: @{reportingPost.author.username}</div>
                <div className="line-clamp-2 italic text-slate-500">"{reportingPost.post.content}"</div>
              </div>

              {reportNotification && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  reportNotification.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {reportNotification.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{reportNotification.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Violation Type</label>
                <div className="space-y-1.5">
                  {[
                    'Spam or automated posting',
                    'Suspicious cryptocurrency or financial links',
                    'Phishing or malicious content',
                    'Impersonation or false identity',
                    'Other'
                  ].map((preset) => (
                    <label
                      key={preset}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        reportReason === preset
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reasonPreset"
                        value={preset}
                        checked={reportReason === preset}
                        onChange={() => setReportReason(preset)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{preset}</span>
                    </label>
                  ))}
                </div>
              </div>

              {reportReason === 'Other' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Specific Reason</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={2}
                    placeholder="Describe the suspicious behavior..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {submittingReport ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
