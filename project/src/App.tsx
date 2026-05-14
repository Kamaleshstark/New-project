import { useState, useEffect, useCallback } from 'react';
import {
  Shield, FileSearch, LayoutDashboard, RefreshCw,
  Zap, User, Search, AlertTriangle, TrendingUp, Clock
} from 'lucide-react';
import { supabase, Claim } from './lib/supabase';
import { ClaimCard } from './components/ClaimCard';
import { ClaimDetail } from './components/ClaimDetail';
import { UploadPanel } from './components/UploadPanel';

type Tab = 'process' | 'dashboard';
type FilterRoute = 'All' | 'Fast-track' | 'Manual Review' | 'Specialist Queue' | 'Investigation Flag';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const ROUTE_FILTERS: FilterRoute[] = ['All', 'Fast-track', 'Manual Review', 'Specialist Queue', 'Investigation Flag'];

const routeIcon: Record<string, React.ReactNode> = {
  'Fast-track': <Zap size={14} />,
  'Manual Review': <User size={14} />,
  'Specialist Queue': <User size={14} />,
  'Investigation Flag': <Search size={14} />,
};

const routeColor: Record<string, string> = {
  'Fast-track': 'text-emerald-600',
  'Manual Review': 'text-amber-600',
  'Specialist Queue': 'text-blue-600',
  'Investigation Flag': 'text-red-600',
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('process');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filterRoute, setFilterRoute] = useState<FilterRoute>('All');
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [latestResult, setLatestResult] = useState<Claim | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoadingClaims(true);
    const { data } = await supabase
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setClaims(data as Claim[]);
    setLoadingClaims(false);
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleProcess = async (text: string, filename: string) => {
    setProcessing(true);
    setLatestResult(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-fnol`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawText: text, filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Processing failed');

      const { data: saved } = await supabase
        .from('claims')
        .select('*')
        .eq('id', data.claimId)
        .maybeSingle();

      if (saved) {
        setLatestResult(saved as Claim);
        setClaims((prev) => [saved as Claim, ...prev.filter((c) => c.id !== saved.id)]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = filterRoute === 'All' ? claims : claims.filter((c) => c.recommended_route === filterRoute);

  const stats = {
    total: claims.length,
    fastTrack: claims.filter((c) => c.recommended_route === 'Fast-track').length,
    manualReview: claims.filter((c) => c.recommended_route === 'Manual Review').length,
    specialist: claims.filter((c) => c.recommended_route === 'Specialist Queue').length,
    flagged: claims.filter((c) => c.recommended_route === 'Investigation Flag').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">ClaimFlow AI</h1>
              <p className="text-xs text-gray-500 leading-tight">FNOL Processing Agent</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setTab('process')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'process' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <FileSearch size={15} />
              Process
            </button>
            <button
              onClick={() => { setTab('dashboard'); fetchClaims(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'process' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Upload panel */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Submit FNOL Document</h2>
                <p className="text-xs text-gray-500 mb-6">Upload or paste your First Notice of Loss document for automated extraction and routing.</p>
                <UploadPanel onProcess={handleProcess} processing={processing} />
              </div>
            </div>

            {/* Result panel */}
            <div className="lg:col-span-3">
              {!latestResult && !processing && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileSearch size={28} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No claim processed yet</p>
                    <p className="text-xs text-gray-400 mt-1">Submit an FNOL document to see results here</p>
                  </div>
                </div>
              )}

              {processing && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Shield size={28} className="text-blue-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Analyzing FNOL document...</p>
                    <p className="text-xs text-gray-400 mt-1">Extracting fields, checking completeness, routing claim</p>
                  </div>
                </div>
              )}

              {latestResult && !processing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Processing Result</h2>
                    <button
                      onClick={() => setSelectedClaim(latestResult)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View full details
                    </button>
                  </div>

                  {/* Route result */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        latestResult.recommended_route === 'Fast-track' ? 'bg-emerald-100' :
                        latestResult.recommended_route === 'Investigation Flag' ? 'bg-red-100' :
                        latestResult.recommended_route === 'Specialist Queue' ? 'bg-blue-100' :
                        'bg-amber-100'
                      }`}>
                        <span className={routeColor[latestResult.recommended_route] ?? 'text-gray-600'}>
                          {routeIcon[latestResult.recommended_route] ?? <AlertTriangle size={14} />}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Recommended Route</p>
                        <p className={`text-base font-bold ${routeColor[latestResult.recommended_route] ?? 'text-gray-800'}`}>
                          {latestResult.recommended_route}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{latestResult.reasoning}</p>
                  </div>

                  {/* Field summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xl font-bold text-gray-900">
                        {Object.values(latestResult.extracted_fields ?? {}).filter(Boolean).length}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Fields Extracted</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                      <p className={`text-xl font-bold ${(latestResult.missing_fields?.length ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {latestResult.missing_fields?.length ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Missing Fields</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xl font-bold text-gray-900">
                        {latestResult.estimated_damage > 0
                          ? `$${(latestResult.estimated_damage / 1000).toFixed(0)}k`
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Est. Damage</p>
                    </div>
                  </div>

                  {/* Extracted key fields preview */}
                  <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
                    {[
                      ['Policy Number', latestResult.extracted_fields?.policyNumber],
                      ['Policyholder', latestResult.extracted_fields?.policyholderName],
                      ['Claim Type', latestResult.extracted_fields?.claimType],
                      ['Incident Date', latestResult.extracted_fields?.incidentDate],
                      ['Location', latestResult.extracted_fields?.incidentLocation],
                      ['Asset Type', latestResult.extracted_fields?.assetType],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex items-center px-5 py-3 gap-4">
                        <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
                        <span className="text-sm text-gray-800 font-medium truncate">
                          {value || <span className="text-gray-300 font-normal italic">Not found</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Missing fields */}
                  {(latestResult.missing_fields?.length ?? 0) > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-700 mb-2">Missing Mandatory Fields</p>
                      <div className="flex flex-wrap gap-2">
                        {latestResult.missing_fields.map((f) => (
                          <span key={f} className="px-2 py-0.5 bg-white border border-amber-200 text-amber-700 rounded text-xs">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="Total Claims" value={stats.total} icon={<TrendingUp size={18} className="text-blue-600" />} color="bg-blue-50" />
              <StatCard label="Fast-track" value={stats.fastTrack} icon={<Zap size={18} className="text-emerald-600" />} color="bg-emerald-50" />
              <StatCard label="Manual Review" value={stats.manualReview} icon={<Clock size={18} className="text-amber-600" />} color="bg-amber-50" />
              <StatCard label="Specialist Queue" value={stats.specialist} icon={<User size={18} className="text-blue-600" />} color="bg-blue-50" />
              <StatCard label="Flagged" value={stats.flagged} icon={<Search size={18} className="text-red-600" />} color="bg-red-50" />
            </div>

            {/* Filter + refresh */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {ROUTE_FILTERS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRoute(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      filterRoute === r
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {r}
                    {r !== 'All' && (
                      <span className="ml-1.5 opacity-75">
                        ({claims.filter((c) => c.recommended_route === r).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchClaims}
                disabled={loadingClaims}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
              >
                <RefreshCw size={13} className={loadingClaims ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Claims grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <LayoutDashboard size={22} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No claims found</p>
                <p className="text-xs text-gray-400 mt-1">Process an FNOL document to see it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((claim) => (
                  <ClaimCard key={claim.id} claim={claim} onClick={() => setSelectedClaim(claim)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedClaim && (
        <ClaimDetail claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
      )}
    </div>
  );
}
