import { AlertTriangle, Zap, User, Search } from 'lucide-react';

type Route = 'Fast-track' | 'Manual Review' | 'Specialist Queue' | 'Investigation Flag' | string;

const config: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  'Fast-track': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <Zap size={14} />,
    label: 'Fast-track',
  },
  'Manual Review': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <User size={14} />,
    label: 'Manual Review',
  },
  'Specialist Queue': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <User size={14} />,
    label: 'Specialist Queue',
  },
  'Investigation Flag': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: <Search size={14} />,
    label: 'Investigation Flag',
  },
};

export function RouteBadge({ route }: { route: Route }) {
  const cfg = config[route] ?? {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: <AlertTriangle size={14} />,
    label: route,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
