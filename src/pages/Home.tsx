import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { ShieldAlert, ShieldCheck, Info, MessageSquare } from 'lucide-react';

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
  const [newPost, setNewPost] = useState('');

  const fetchFeed = async () => {
    const res = await fetch('/api/recommendations/feed');
    const data = await res.json();
    if (data.feed) setFeed(data.feed);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPost, category: 'General' })
    });
    setNewPost('');
    fetchFeed();
  };

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading feed...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Create Post</h2>
        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea 
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={3}
            placeholder="What's on your mind?"
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
          />
          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
              Post
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold px-2">Trust-Aware Feed</h2>
        {feed.map(({ post, author, scores, explanation }) => (
          <div key={post.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {author.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {author.name} 
                    <span className="text-sm font-normal text-neutral-500">@{author.username}</span>
                  </div>
                  <div className="text-xs text-neutral-500">{new Date(post.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {author.trustScore >= 70 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                    <ShieldCheck className="w-3 h-3" /> High Trust
                  </div>
                )}
                {author.riskScore >= 70 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg">
                    <ShieldAlert className="w-3 h-3" /> High Risk
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-neutral-800 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            <div className="bg-neutral-50 p-4 rounded-xl space-y-2 border border-neutral-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <Info className="w-4 h-4" />
                Why am I seeing this?
              </div>
              <ul className="space-y-1">
                {explanation.map((reason, i) => (
                  <li key={i} className="text-sm text-neutral-600 flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-400 rounded-full" />
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-neutral-400 pt-2 mt-2 border-t border-neutral-200">
                Algorithmic Score: {scores.finalScore.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
                <MessageSquare className="w-4 h-4" /> Comment
              </button>
            </div>
          </div>
        ))}
        {feed.length === 0 && (
          <div className="text-center text-neutral-500 py-12 bg-white rounded-2xl border border-neutral-200">
            No posts to show yet.
          </div>
        )}
      </div>
    </div>
  );
}
