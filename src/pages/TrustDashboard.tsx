import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';

type TrustData = {
  trustScore: number;
  trustLevel: string;
  riskScore: number;
  riskLevel: string;
  positiveFactors: string[];
  negativeFactors: string[];
  riskFactors: string[];
  recentEvents: { date: string, description: string, type: string }[];
};

export default function TrustDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<TrustData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trust/me')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading trust profile...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load trust profile.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Trust & Security Dashboard</h1>
        <p className="text-neutral-500">Understand your algorithmic trust and risk profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-neutral-600 font-medium mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Trust Score
            </div>
            <div className="text-4xl font-bold text-neutral-900">{data.trustScore}<span className="text-xl text-neutral-400 font-normal">/100</span></div>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
              {data.trustLevel}
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-6 pt-4 border-t border-neutral-100">
            Based on account reliability, profile completeness, social trust, positive engagement, behavioral consistency, and community feedback.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-neutral-600 font-medium mb-4">
              <ShieldAlert className="w-5 h-5 text-orange-600" /> Risk Score
            </div>
            <div className="text-4xl font-bold text-neutral-900">{data.riskScore}<span className="text-xl text-neutral-400 font-normal">/100</span></div>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg">
              {data.riskLevel}
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-6 pt-4 border-t border-neutral-100">
            Based on account age, rapid posting velocity, community reports, and behavioral consistency.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Algorithmic Signals Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-green-700 mb-4 border-b border-neutral-100 pb-2">Positive Trust Signals</h4>
            <ul className="space-y-3">
              {data.positiveFactors && data.positiveFactors.length > 0 ? data.positiveFactors.map((factor, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-700">
                  <span className="text-green-600 font-bold">✓</span> {factor}
                </li>
              )) : (
                <li className="text-sm text-neutral-500">Building positive history...</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-amber-700 mb-4 border-b border-neutral-100 pb-2">Negative Trust Factors</h4>
            <ul className="space-y-3">
              {data.negativeFactors && data.negativeFactors.length > 0 ? data.negativeFactors.map((factor, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-700">
                  <span className="text-amber-600 font-bold">−</span> {factor}
                </li>
              )) : (
                <li className="text-sm text-neutral-500">No limiting trust factors</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-red-700 mb-4 border-b border-neutral-100 pb-2">Security Risk Signals</h4>
            <ul className="space-y-3">
              {data.riskFactors && data.riskFactors.length > 0 ? data.riskFactors.map((factor, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-700">
                  <span className={factor === 'No significant risk signals' ? 'text-neutral-400' : 'text-red-600'}>
                    {factor === 'No significant risk signals' ? 'ℹ' : '⚠'}
                  </span> {factor}
                </li>
              )) : (
                <li className="text-sm text-neutral-500">None significant</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Recent Trust Events
        </h3>
        {data.recentEvents && data.recentEvents.length > 0 ? (
          <div className="space-y-4">
            {data.recentEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                  event.type === 'positive' ? 'bg-green-500' :
                  event.type === 'negative' ? 'bg-red-500' : 'bg-neutral-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-neutral-800">{event.description}</p>
                  <p className="text-xs text-neutral-500">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No recent events.</p>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">Academic Transparency Notice</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          These scores are algorithmic estimates generated for this academic prototype. 
          They are used to rank content in your Trust-Aware Feed and do not prove absolute trustworthiness or malicious intent.
        </p>
      </div>
    </div>
  );
}
