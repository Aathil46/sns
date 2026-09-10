import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Clock,
  Shield,
  Layers,
  Scale
} from 'lucide-react';

type TrustData = {
  trustScore: number;
  trustLevel: string;
  riskScore: number;
  riskLevel: string;
  positiveFactors: string[];
  negativeFactors: string[];
  riskFactors: string[];
  recentEvents: { date: string; description: string; type: string }[];
};

export default function TrustDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<TrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/me');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load trust profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await fetch('/api/trust/recalculate', { method: 'POST' });
      const json = await res.json();
      if (json.scores) {
        setData(json.scores);
        setRecalcSuccess(true);
        setTimeout(() => setRecalcSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Recalculation error:', err);
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="p-8 bg-white rounded-2xl border border-rose-200 text-rose-600 space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto" />
          <p className="font-semibold text-sm">Failed to retrieve algorithmic trust telemetry.</p>
          <button
            onClick={fetchScores}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const getTrustBadgeClass = (score: number) => {
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score > 30) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getRiskBadgeClass = (score: number) => {
    if (score >= 70) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (score > 30) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Top Header with Recalculate CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-blue-600" />
            Trust & Security Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmic trust and behavioral risk telemetry for <span className="font-semibold text-slate-700">@{user?.username}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {recalcSuccess && (
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Updated
            </span>
          )}
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Recalculate Scores'}</span>
          </button>
        </div>
      </div>

      {/* Hero Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trust Score Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Trust Score</span>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shadow-2xs ${getTrustBadgeClass(data.trustScore)}`}>
                {data.trustLevel}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{data.trustScore}</span>
              <span className="text-slate-400 font-medium text-sm">/ 100</span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.trustScore >= 70 ? 'bg-emerald-500' : data.trustScore > 30 ? 'bg-blue-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, data.trustScore))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-medium text-slate-400">
                <span>0 (Low)</span>
                <span>30 (Medium)</span>
                <span>70 (High)</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100 leading-relaxed">
            Composite evaluation of account reliability (15%), profile completeness (15%), social trust (25%), positive interactions (20%), behavioral consistency (15%), and community reports (10%).
          </p>
        </div>

        {/* Risk Score Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Security Risk Score</span>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shadow-2xs ${getRiskBadgeClass(data.riskScore)}`}>
                {data.riskLevel}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold tracking-tight ${data.riskScore >= 70 ? 'text-rose-600' : 'text-slate-900'}`}>
                {data.riskScore}
              </span>
              <span className="text-slate-400 font-medium text-sm">/ 100</span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.riskScore >= 70 ? 'bg-rose-500' : data.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, data.riskScore))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-medium text-slate-400">
                <span>0 (Safe)</span>
                <span>30 (Caution)</span>
                <span>70 (Elevated Risk)</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100 leading-relaxed">
            Evaluates account creation recency (&lt;1 day), rapid burst posting frequency within 24 hours, and community flags/reports.
          </p>
        </div>
      </div>

      {/* Trust Components Architectural Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Trust Engine Component Weights</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Reliability</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">15%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Account age</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Profile</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">15%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Bio & identity</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Social</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">25%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Network trust</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Interactions</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">20%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Likes received</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Consistency</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">15%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Time spread</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Feedback</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">10%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Community flags</div>
          </div>
        </div>
      </div>

      {/* 3-Column Algorithmic Signals Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Algorithmic Signals Breakdown</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Positive Signals */}
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider pb-2 border-b border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Positive Signals</span>
            </div>
            <ul className="space-y-2">
              {data.positiveFactors && data.positiveFactors.length > 0 ? (
                data.positiveFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{factor}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400 italic">No strong positive signals recorded yet.</li>
              )}
            </ul>
          </div>

          {/* Negative Trust Factors */}
          <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider pb-2 border-b border-amber-200/60">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Negative Factors</span>
            </div>
            <ul className="space-y-2">
              {data.negativeFactors && data.negativeFactors.length > 0 ? (
                data.negativeFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                    <span className="text-amber-600 font-bold">−</span>
                    <span>{factor}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400 italic">No limiting trust factors detected.</li>
              )}
            </ul>
          </div>

          {/* Security Risk Signals */}
          <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider pb-2 border-b border-rose-200/60">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Security Risk Signals</span>
            </div>
            <ul className="space-y-2">
              {data.riskFactors && data.riskFactors.length > 0 ? (
                data.riskFactors.map((factor, i) => {
                  const isSafe = factor === 'No significant risk signals';
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                      <span className={isSafe ? 'text-slate-400' : 'text-rose-600 font-bold'}>
                        {isSafe ? 'ℹ' : '⚠'}
                      </span>
                      <span className={isSafe ? 'text-slate-500' : 'font-medium text-rose-900'}>{factor}</span>
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-slate-400 italic">None recorded.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Trust Events Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Recent Trust & Telemetry Events</h2>
          </div>
          <span className="text-[11px] text-slate-400">Chronological telemetry audit</span>
        </div>

        {data.recentEvents && data.recentEvents.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {data.recentEvents
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((event, i) => {
                const isPositive = event.type === 'positive';
                const isNegative = event.type === 'negative';

                return (
                  <div key={i} className="relative group">
                    <div
                      className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                        isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-blue-400'
                      }`}
                    />
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="text-xs font-semibold text-slate-800">{event.description}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(event.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            No telemetry events registered yet.
          </div>
        )}
      </div>

      {/* Academic Transparency Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-6 rounded-2xl border border-blue-100 flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Academic Transparency & Ethics Notice</h2>
          <p className="text-xs text-blue-800 leading-relaxed">
            These trust and risk evaluations are deterministic rule-based indicators generated exclusively for local evaluation of this academic prototype.
            They are utilized to adjust content positioning in the Trust-Aware Feed and do not represent absolute judgments of human trustworthiness or character.
          </p>
        </div>
      </div>
    </div>
  );
}
