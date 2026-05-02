import { Navigation, Shield, AlertTriangle, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  zoneCount: number;
  disruptionCount: number;
}

export default function Header({ activeTab, onTabChange, zoneCount, disruptionCount }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'route', label: 'Route Planner', icon: Navigation },
    { id: 'zones', label: 'Construction Zones', icon: Shield, badge: zoneCount },
    { id: 'alerts', label: 'Live Alerts', icon: AlertTriangle, badge: disruptionCount },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 relative z-50">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">Nagpur SmartRoute</h1>
            <p className="text-[11px] text-slate-500 leading-none hidden sm:block">AI-Powered Navigation</p>
          </div>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  tab.id === 'alerts'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-slide-in-up">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  tab.id === 'alerts'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
