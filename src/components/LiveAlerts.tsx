import { AlertTriangle, Clock, MapPin, Radio } from 'lucide-react';
import type { TrafficDisruption } from '../lib/types';
import { SEVERITY_BG, DISRUPTION_TYPE_LABELS } from '../lib/types';

interface LiveAlertsProps {
  disruptions: TrafficDisruption[];
  loading: boolean;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  accident: '🚗',
  congestion: '🚦',
  road_closure: '🚧',
  waterlogging: '🌊',
  procession: '🎭',
};

export default function LiveAlerts({ disruptions, loading }: LiveAlertsProps) {
  const active = disruptions.filter(d => d.status === 'active');
  const cleared = disruptions.filter(d => d.status === 'cleared');

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="h-4 w-48 skeleton rounded" />
            <div className="h-3 w-64 skeleton rounded" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 w-16 skeleton rounded-full" />
              <div className="h-5 w-20 skeleton rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Live Alerts</h2>
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">
            {active.length} ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          <p className="text-xs text-red-700 font-medium">
            Real-time traffic disruptions in Nagpur
          </p>
        </div>
      </div>

      {/* Active alerts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {active.length > 0 && (
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Disruptions</p>
        )}

        {active.map(d => (
          <div
            key={d.id}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all animate-slide-in-up"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg mt-0.5">{TYPE_ICONS[d.disruption_type] || '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">{d.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{d.description}</p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${SEVERITY_BG[d.severity]}`}>
                    {d.severity}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {DISRUPTION_TYPE_LABELS[d.disruption_type]}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {timeAgo(d.reported_at)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}
                  </div>
                </div>

                {d.affected_roads.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {d.affected_roads.map(road => (
                      <span key={road} className="px-1.5 py-0.5 text-[10px] bg-slate-50 text-slate-500 rounded border border-slate-200">
                        {road}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {cleared.length > 0 && (
          <>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold pt-3">Cleared</p>
            {cleared.map(d => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 opacity-60"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">{TYPE_ICONS[d.disruption_type] || '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-600">{d.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Cleared
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {d.cleared_at ? timeAgo(d.cleared_at) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {active.length === 0 && cleared.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No active disruptions</p>
            <p className="text-xs text-slate-400 mt-1">All clear in Nagpur!</p>
          </div>
        )}
      </div>
    </div>
  );
}
