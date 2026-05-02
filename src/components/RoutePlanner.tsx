import { useState } from 'react';
import {
  MapPin, Navigation, Search, X, Clock, Shield, Route,
  ChevronRight, ChevronDown, Loader2, ArrowRightLeft,
  AlertTriangle, Construction, Zap, Footprints, Car, Flag,
  CircleDot, ArrowUp, ArrowLeft, ArrowRight, Minus
} from 'lucide-react';
import type { RouteSuggestion, RouteStep } from '../lib/types';

interface RoutePlannerProps {
  origin: string;
  destination: string;
  routes: RouteSuggestion[];
  selectedRoute: RouteSuggestion | null;
  isCalculating: boolean;
  routeError: string | null;
  onOriginChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
  onCalculate: () => void;
  onClear: () => void;
  onSelectRoute: (r: RouteSuggestion) => void;
}

const SUGGESTIONS = [
  'Sitabuldi', 'Dharampeth', 'Civil Lines', 'Medical Square',
  'Airport', 'MIHAN', 'Wardha Road', 'Hingna',
  'Ramdaspeth', 'Ravi Nagar', 'Ajni', 'Pardi',
];

const STEP_ICONS: Record<RouteStep['icon'], React.ReactNode> = {
  start: <Flag className="w-3.5 h-3.5" />,
  turn: <ArrowRight className="w-3.5 h-3.5" />,
  straight: <ArrowUp className="w-3.5 h-3.5" />,
  arrive: <MapPin className="w-3.5 h-3.5" />,
  avoid: <AlertTriangle className="w-3.5 h-3.5" />,
  merge: <Minus className="w-3.5 h-3.5" />,
};

const STEP_ICON_BG: Record<RouteStep['icon'], string> = {
  start: 'bg-emerald-100 text-emerald-600',
  turn: 'bg-blue-100 text-blue-600',
  straight: 'bg-slate-100 text-slate-600',
  arrive: 'bg-red-100 text-red-600',
  avoid: 'bg-amber-100 text-amber-600',
  merge: 'bg-slate-100 text-slate-600',
};

function SafetyBadge({ score }: { score: number }) {
  const bg = score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 60 ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${bg}`}>
      {score}/100
    </span>
  );
}

export default function RoutePlanner({
  origin, destination, routes, selectedRoute,
  isCalculating, routeError,
  onOriginChange, onDestinationChange,
  onCalculate, onClear, onSelectRoute,
}: RoutePlannerProps) {
  const hasRoutes = routes.length > 0;
  const [showSteps, setShowSteps] = useState(false);
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'walk'>('car');

  const swapLocations = () => {
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input section */}
      <div className="p-4 pb-3 border-b border-slate-100">
        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Route className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Plan Your Route</h2>
            <p className="text-[10px] text-slate-400">Avoid construction & disruptions</p>
          </div>
        </div>

        {/* Origin / Destination inputs */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[19px] top-[34px] w-[2px] h-[20px] bg-slate-200 z-0" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-[10px] h-[10px] rounded-full bg-emerald-500 border-2 border-white shadow-sm flex-shrink-0 ml-[14px]" />
              <input
                type="text"
                value={origin}
                onChange={e => onOriginChange(e.target.value)}
                placeholder="Origin (e.g., Sitabuldi)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                onKeyDown={e => e.key === 'Enter' && onCalculate()}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full bg-red-500 border-2 border-white shadow-sm flex-shrink-0 ml-[14px]" />
              <input
                type="text"
                value={destination}
                onChange={e => onDestinationChange(e.target.value)}
                placeholder="Destination (e.g., Airport)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                onKeyDown={e => e.key === 'Enter' && onCalculate()}
              />
            </div>
          </div>

          {/* Swap button */}
          <button
            onClick={swapLocations}
            className="absolute right-[-8px] top-[18px] w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all z-20"
            title="Swap origin and destination"
          >
            <ArrowRightLeft className="w-3 h-3 text-slate-500" />
          </button>
        </div>

        {/* Transport mode selector */}
        <div className="flex items-center gap-1 mt-3 bg-slate-100 p-0.5 rounded-lg">
          {[
            { id: 'car' as const, icon: Car, label: 'Car' },
            { id: 'bike' as const, icon: Zap, label: 'Bike' },
            { id: 'walk' as const, icon: Footprints, label: 'Walk' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setTransportMode(mode.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                transportMode === mode.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <mode.icon className="w-3.5 h-3.5" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Search button */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onCalculate}
            disabled={isCalculating || !origin || !destination}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            {isCalculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isCalculating ? 'Analyzing Routes...' : 'Find Best Routes'}
          </button>
          {hasRoutes && (
            <button
              onClick={onClear}
              className="px-3 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
              title="Clear routes"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick suggestions */}
        {!hasRoutes && (
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">Popular locations</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    if (!origin) onOriginChange(s);
                    else if (!destination) onDestinationChange(s);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {routeError && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-slide-in-up">
          {routeError}
        </div>
      )}

      {/* Loading skeleton */}
      {isCalculating && (
        <div className="p-4 space-y-3">
          <div className="h-3 w-32 skeleton rounded" />
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="h-4 w-28 skeleton rounded" />
              <div className="h-3 w-48 skeleton rounded" />
              <div className="flex gap-4 mt-2">
                <div className="h-3 w-16 skeleton rounded" />
                <div className="h-3 w-16 skeleton rounded" />
                <div className="h-3 w-20 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Route results */}
      {hasRoutes && !isCalculating && (
        <div className="flex-1 overflow-y-auto">
          {/* Selected route summary bar */}
          {selectedRoute && (
            <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{selectedRoute.name}</span>
                <SafetyBadge score={selectedRoute.safety_score} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-blue-300" />
                  <span className="text-lg font-bold">{selectedRoute.distance_km}</span>
                  <span className="text-xs text-slate-400">km</span>
                </div>
                <div className="w-px h-6 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-300" />
                  <span className="text-lg font-bold">{selectedRoute.estimated_time_min}</span>
                  <span className="text-xs text-slate-400">min</span>
                </div>
                <div className="w-px h-6 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">{selectedRoute.safety_score}</span>
                  <span className="text-xs text-slate-400">safety</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                {selectedRoute.zones_on_route > 0 ? (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Construction className="w-3 h-3" />
                    {selectedRoute.zones_on_route} zone(s) on route
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Construction className="w-3 h-3" />
                    No zones on route
                  </span>
                )}
                {selectedRoute.zones_avoided > 0 && (
                  <span className="flex items-center gap-1 text-blue-300">
                    <Shield className="w-3 h-3" />
                    Avoids {selectedRoute.zones_avoided} zone(s)
                  </span>
                )}
                {selectedRoute.disruptions_nearby > 0 && (
                  <span className="flex items-center gap-1 text-orange-400">
                    <AlertTriangle className="w-3 h-3" />
                    {selectedRoute.disruptions_nearby} nearby
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Route comparison cards */}
          <div className="px-4 mt-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
              {routes.length} routes available
            </p>
            <div className="space-y-2">
              {routes.map((route, idx) => {
                const isSelected = selectedRoute?.name === route.name;
                return (
                  <button
                    key={idx}
                    onClick={() => { onSelectRoute(route); setShowSteps(false); }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 animate-slide-in-up ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full border-2"
                          style={{ borderColor: route.color, backgroundColor: isSelected ? route.color : 'transparent' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{route.name}</h3>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded">BEST</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{route.description}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-slate-300'}`} />
                    </div>

                    <div className="flex items-center gap-3 mt-2.5 pl-5">
                      <span className="text-xs text-slate-600 font-medium">{route.distance_km} km</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs text-slate-600 font-medium">~{route.estimated_time_min} min</span>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${route.safety_score}%`, backgroundColor: route.color }}
                          />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: route.color }}>{route.safety_score}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turn-by-turn directions */}
          {selectedRoute && (
            <div className="px-4 mt-4 pb-4">
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Turn-by-turn directions
                <span className="text-slate-400">({selectedRoute.steps.length} steps)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSteps ? 'rotate-180' : ''}`} />
              </button>

              {showSteps && (
                <div className="mt-2 space-y-0 animate-fade-in">
                  {selectedRoute.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${STEP_ICON_BG[step.icon]}`}>
                          {STEP_ICONS[step.icon]}
                        </div>
                        {idx < selectedRoute.steps.length - 1 && (
                          <div className="w-px h-full bg-slate-200 min-h-[16px]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-3 min-w-0">
                        <p className="text-xs font-medium text-slate-800">{step.instruction}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">{step.road}</span>
                          {step.distance_km > 0 && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-[11px] text-slate-400">{step.distance_km} km</span>
                            </>
                          )}
                          {step.duration_min > 0 && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-[11px] text-slate-400">{step.duration_min} min</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasRoutes && !isCalculating && !routeError && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Plan Your Journey</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[220px] mx-auto">
              Enter origin and destination to find the safest route avoiding construction zones
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
