import { useState } from 'react';
import Header from './components/Header';
import MapComponent from './components/MapComponent';
import RoutePlanner from './components/RoutePlanner';
import ConstructionZones from './components/ConstructionZones';
import LiveAlerts from './components/LiveAlerts';
import ChatBot from './components/ChatBot';
import { useMapData } from './hooks/useMapData';
import { useRoutePlanner } from './hooks/useRoutePlanner';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function App() {
  const { zones, disruptions, loading } = useMapData();
  const {
    origin, setOrigin,
    destination, setDestination,
    routes, selectedRoute, setSelectedRoute,
    isCalculating, routeError,
    calculateRoutes, clearRoutes,
  } = useRoutePlanner(zones, disruptions);

  const [activeTab, setActiveTab] = useState('route');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        zoneCount={zones.filter(z => z.status === 'active').length}
        disruptionCount={disruptions.filter(d => d.status === 'active').length}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3 left-3 z-40 p-2 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-slate-600" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-[380px]' : 'w-0'
          } transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 border-r border-slate-200/80 bg-white`}
        >
          <div className="w-[380px] h-full overflow-hidden flex flex-col">
            {activeTab === 'route' && (
              <RoutePlanner
                origin={origin}
                destination={destination}
                routes={routes}
                selectedRoute={selectedRoute}
                isCalculating={isCalculating}
                routeError={routeError}
                onOriginChange={setOrigin}
                onDestinationChange={setDestination}
                onCalculate={calculateRoutes}
                onClear={clearRoutes}
                onSelectRoute={setSelectedRoute}
              />
            )}
            {activeTab === 'zones' && (
              <ConstructionZones zones={zones} loading={loading} />
            )}
            {activeTab === 'alerts' && (
              <LiveAlerts disruptions={disruptions} loading={loading} />
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapComponent
            zones={zones}
            disruptions={disruptions}
            selectedRoute={selectedRoute}
            allRoutes={routes}
          />

          {/* Map overlay stats */}
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <div className="px-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 text-xs">
              <span className="text-slate-500">Zones:</span>{' '}
              <span className="font-semibold text-slate-900">{zones.filter(z => z.status === 'active').length}</span>
            </div>
            <div className="px-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 text-xs">
              <span className="text-slate-500">Alerts:</span>{' '}
              <span className="font-semibold text-red-600">{disruptions.filter(d => d.status === 'active').length}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 p-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="w-3 h-3 rounded-full bg-blue-500 opacity-30 border border-blue-500" />
                Metro Construction
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="w-3 h-3 rounded-full bg-amber-500 opacity-30 border border-amber-500" />
                Road Repair
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="w-3 h-3 rounded-full bg-violet-500 opacity-30 border border-violet-500" />
                Utility Work
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                Disruption
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatBot />
    </div>
  );
}

export default App;
