import { X, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { Claim } from '../lib/supabase';
import { RouteBadge } from './RouteBadge';

const FIELD_LABELS: Record<string, string> = {
  policyNumber: 'Policy Number',
  policyholderName: 'Policyholder Name',
  effectiveDates: 'Effective Dates',
  incidentDate: 'Incident Date',
  incidentTime: 'Incident Time',
  incidentLocation: 'Incident Location',
  incidentDescription: 'Incident Description',
  claimant: 'Claimant',
  thirdParties: 'Third Parties',
  contactDetails: 'Contact Details',
  email: 'Email',
  assetType: 'Asset Type',
  assetId: 'Asset ID',
  estimatedDamage: 'Estimated Damage',
  claimType: 'Claim Type',
  attachments: 'Attachments',
  initialEstimate: 'Initial Estimate',
};

interface Props {
  claim: Claim;
  onClose: () => void;
}

export function ClaimDetail({ claim, onClose }: Props) {
  const extracted = claim.extracted_fields ?? {};
  const missing = new Set(claim.missing_fields ?? []);

  const routeColor: Record<string, string> = {
    'Fast-track': 'bg-emerald-50 border-emerald-200',
    'Manual Review': 'bg-amber-50 border-amber-200',
    'Specialist Queue': 'bg-blue-50 border-blue-200',
    'Investigation Flag': 'bg-red-50 border-red-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-gray-400 font-mono">{claim.policy_number || 'No Policy #'}</p>
            <h2 className="text-lg font-bold text-gray-900">{claim.policyholder_name || 'Unknown Policyholder'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Routing Result */}
          <div className={`rounded-xl border p-4 ${routeColor[claim.recommended_route] ?? 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight size={16} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommended Route</span>
            </div>
            <div className="mb-3">
              <RouteBadge route={claim.recommended_route} />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{claim.reasoning}</p>
          </div>

          {/* Missing Fields */}
          {missing.size > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                Missing Fields ({missing.size})
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(missing).map((f) => (
                  <span key={f} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium">
                    {FIELD_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Fields */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              Extracted Fields
            </h3>
            <div className="space-y-1 rounded-xl border border-gray-200 overflow-hidden">
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const value = extracted[key];
                const isMissing = missing.has(key);
                return (
                  <div
                    key={key}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${isMissing ? 'bg-amber-50/50' : ''}`}
                  >
                    <span className="text-xs font-medium text-gray-500 w-36 shrink-0 pt-0.5">{label}</span>
                    {value ? (
                      <span className="text-sm text-gray-900 break-words flex-1">{value}</span>
                    ) : (
                      <span className="text-sm text-gray-400 italic flex-1">Not found</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw JSON Output */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">JSON Output</h3>
            <pre className="bg-gray-950 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">
              {JSON.stringify(
                {
                  extractedFields: extracted,
                  missingFields: Array.from(missing),
                  recommendedRoute: claim.recommended_route,
                  reasoning: claim.reasoning,
                },
                null,
                2
              )}
            </pre>
          </div>

          {/* Raw Text */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Raw Document Text</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed font-mono">
              {claim.raw_text || 'No raw text available.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
