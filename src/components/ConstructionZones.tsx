import { Shield, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ConstructionZone } from '../lib/types';
import { SEVERITY_BG, ZONE_TYPE_LABELS } from '../lib/types';

interface ConstructionZonesProps {
  zones: ConstructionZone[];
  loading: boolean;
}

export default function ConstructionZones({ zones, loading }: ConstructionZonesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = zones.filter(z => {
    if (filter === 'all') return true;
    if (filter === 'active') return z.status === 'active';
    if (filter === 'planned') return z.status === 'planned';
    return z.zone_type === filter;
  });

  const activeCount = zones.filter(z => z.status === 'active').length;
  const plannedCount = zones.filter(z => z.status === 'planned').length;

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="h-4 w-40 skeleton rounded" />
            <div className="h-3 w-56 skeleton rounded" />
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
      {/* Summary */}
      <div className="p-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Construction Zones</h2>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2.5 bg-slate-50 rounded-xl text-center">
            <div className="text-lg font-bold text-slate-900">{zones.length}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total</div>
          </div>
          <div className="p-2.5 bg-red-50 rounded-xl text-center">
            <div className="text-lg font-bold text-red-700">{activeCount}</div>
            <div className="text-[10px] text-red-500 uppercase tracking-wider">Active</div>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl text-center">
            <div className="text-lg font-bold text-amber-700">{plannedCount}</div>
            <div className="text-[10px] text-amber-500 uppercase tracking-wider">Planned</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'planned', label: 'Planned' },
            { id: 'metro_construction', label: 'Metro' },
            { id: 'road_repair', label: 'Road Repair' },
            { id: 'utility_work', label: 'Utility' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.map(zone => {
          const isExpanded = expandedId === zone.id;
          return (
            <div
              key={zone.id}
              className={`rounded-xl border transition-all duration-200 ${
                isExpanded ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : zone.id)}
                className="w-full text-left p-3.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{zone.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${SEVERITY_BG[zone.severity]}`}>
                        {zone.severity}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {ZONE_TYPE_LABELS[zone.zone_type]}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                        zone.status === 'active'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : zone.status === 'planned'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {zone.status}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-0 animate-fade-in">
                  <div className="border-t border-slate-100 pt-3 space-y-2.5">
                    <p className="text-xs text-slate-600 leading-relaxed">{zone.description}</p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                      <span className="text-slate-300">|</span>
                      <span>Radius: {zone.radius_meters}m</span>
                    </div>

                    {zone.start_date && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(zone.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          {zone.end_date ? ` - ${new Date(zone.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ' - Ongoing'}
                        </span>
                      </div>
                    )}

                    {zone.affected_roads.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Affected Roads</p>
                        <div className="flex flex-wrap gap-1">
                          {zone.affected_roads.map(road => (
                            <span key={road} className="px-2 py-0.5 text-[11px] bg-slate-50 text-slate-600 rounded-md border border-slate-200">
                              {road}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No zones match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
