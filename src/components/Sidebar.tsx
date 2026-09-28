import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Flag,
  FileCheck2,
  ScanEye,
  Scale,
  TrendingDown,
  BarChart3,
  UploadCloud,
  FileSpreadsheet,
  BrainCircuit,
  History,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  stats?: {
    highAttentionCses: number;
    contradictions: number;
    reviewCases: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  stats = { highAttentionCses: 4, contradictions: 3, reviewCases: 12 }
}) => {
  const navSections = [
    {
      title: 'SUPERVISORY INTELLIGENCE',
      items: [
        {
          label: 'Command Center',
          path: '/dashboard',
          icon: LayoutDashboard,
          badge: null
        },
        {
          label: 'CSE Assessment',
          path: '/cse',
          icon: ShieldAlert,
          badge: stats.highAttentionCses > 0 ? `${stats.highAttentionCses} At Risk` : null,
          badgeColor: 'bg-red-950 text-red-400 border border-red-800'
        },
        {
          label: 'Supervisory Signals',
          path: '/findings',
          icon: Flag,
          badge: null
        },
        {
          label: 'Case Review Queue',
          path: '/cases',
          icon: FileCheck2,
          badge: stats.reviewCases > 0 ? `${stats.reviewCases}` : null,
          badgeColor: 'bg-amber-950 text-amber-400 border border-amber-800'
        }
      ]
    },
    {
      title: 'CORE ANALYTIC ENGINES',
      items: [
        {
          label: 'Negative Space Engine',
          path: '/negative-space',
          icon: ScanEye,
          badge: 'Core',
          badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-800'
        },
        {
          label: 'KPI-Evidence Contradictions',
          path: '/kpi-evidence',
          icon: Scale,
          badge: stats.contradictions > 0 ? `${stats.contradictions}` : null,
          badgeColor: 'bg-red-950 text-red-400 border border-red-800'
        },
        {
          label: 'Peer Benchmarking',
          path: '/benchmarking',
          icon: BarChart3,
          badge: null
        },
        {
          label: 'Historical Trends',
          path: '/trends',
          icon: TrendingDown,
          badge: 'Trend',
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700'
        }
      ]
    },
    {
      title: 'OPERATIONS & AUDIT',
      items: [
        {
          label: 'Data Ingestion',
          path: '/ingestion',
          icon: UploadCloud,
          badge: null
        },
        {
          label: 'Supervisory Reports',
          path: '/reports',
          icon: FileSpreadsheet,
          badge: 'PDF/CSV',
          badgeColor: 'bg-blue-950 text-blue-400 border border-blue-800'
        },
        {
          label: 'Analytics Explainability',
          path: '/analytics',
          icon: BrainCircuit,
          badge: '5 Engines',
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700'
        },
        {
          label: 'Supervisory Audit Trail',
          path: '/audit',
          icon: History,
          badge: null
        },
        {
          label: 'Scoring & Thresholds',
          path: '/settings',
          icon: Settings,
          badge: null
        }
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return currentRoute === '/' || currentRoute === '/dashboard';
    return currentRoute.startsWith(path);
  };

  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition group ${
                    active
                      ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Supervisory Philosophy Banner */}
      <div className="p-3 m-3 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
        <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> SUPERVISORY DOCTRINE
        </div>
        <p className="leading-relaxed">
          "SOClens recommends. Supervisors decide."
        </p>
      </div>
    </aside>
  );
};
