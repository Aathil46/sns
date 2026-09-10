import { useAuth } from '../lib/AuthContext';
import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';

export default function TrustDashboard() {
  const { user } = useAuth();

  const trustScore = user?.trustScore ?? 50;
  const riskScore = user?.riskScore ?? 10;

  let trustLevel = 'Medium Trust';
  if (trustScore > 70) trustLevel = 'High Trust';
  if (trustScore <= 30) trustLevel = 'Low Trust';

  let riskLevel = 'Medium Risk';
  if (riskScore > 70) riskLevel = 'High Risk';
  if (riskScore <= 30) riskLevel = 'Low Risk';

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
            <div className="text-4xl font-bold text-neutral-900">{trustScore}<span className="text-xl text-neutral-400 font-normal">/100</span></div>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
              {trustLevel}
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-6 pt-4 border-t border-neutral-100">
            Based on account reliability, social connections, positive interactions, and behavioral consistency.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-neutral-600 font-medium mb-4">
              <ShieldAlert className="w-5 h-5 text-orange-600" /> Risk Score
            </div>
            <div className="text-4xl font-bold text-neutral-900">{riskScore}<span className="text-xl text-neutral-400 font-normal">/100</span></div>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg">
              {riskLevel}
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-6 pt-4 border-t border-neutral-100">
            Based on spam-like activity, reports, excessive connection requests, and behavioral anomalies.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Positive & Risk Signals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-green-700 mb-4 border-b border-neutral-100 pb-2">Positive Signals</h4>
            <ul className="space-y-3">
              {trustScore > 70 ? (
                <>
                  <li className="flex gap-2 text-sm text-neutral-700">
                    <span className="text-green-600">✓</span> Established account history
                  </li>
                  <li className="flex gap-2 text-sm text-neutral-700">
                    <span className="text-green-600">✓</span> Healthy interaction history
                  </li>
                  <li className="flex gap-2 text-sm text-neutral-700">
                    <span className="text-green-600">✓</span> Strong trusted network
                  </li>
                </>
              ) : (
                <li className="text-sm text-neutral-500">Building positive history...</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-red-700 mb-4 border-b border-neutral-100 pb-2">Risk Signals</h4>
            <ul className="space-y-3">
              {riskScore > 50 ? (
                <>
                  <li className="flex gap-2 text-sm text-neutral-700">
                    <span className="text-red-600">⚠</span> High frequency of reported posts
                  </li>
                  <li className="flex gap-2 text-sm text-neutral-700">
                    <span className="text-red-600">⚠</span> Suspicious interaction patterns
                  </li>
                </>
              ) : (
                <li className="text-sm text-neutral-500">None significant</li>
              )}
            </ul>
          </div>
        </div>
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
