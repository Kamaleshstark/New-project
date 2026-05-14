import { Calendar, MapPin, DollarSign, FileText } from 'lucide-react';
import { Claim } from '../lib/supabase';
import { RouteBadge } from './RouteBadge';

interface Props {
  claim: Claim;
  onClick: () => void;
}

export function ClaimCard({ claim, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-400 font-mono mb-1">{claim.policy_number || 'No Policy #'}</p>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {claim.policyholder_name || 'Unknown Policyholder'}
          </h3>
        </div>
        <RouteBadge route={claim.recommended_route} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {claim.incident_date && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} className="text-gray-400" />
            {claim.incident_date}
          </div>
        )}
        {claim.incident_location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">{claim.incident_location}</span>
          </div>
        )}
        {claim.estimated_damage > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <DollarSign size={12} className="text-gray-400" />
            {claim.estimated_damage.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          </div>
        )}
        {claim.claim_type && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
            <FileText size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">{claim.claim_type}</span>
          </div>
        )}
      </div>

      {claim.missing_fields?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-amber-600 font-medium">
            {claim.missing_fields.length} missing field{claim.missing_fields.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </button>
  );
}
