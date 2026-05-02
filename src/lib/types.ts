export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type ZoneType = 'metro_construction' | 'road_repair' | 'utility_work' | 'event';

export type ZoneStatus = 'active' | 'planned' | 'completed';

export type DisruptionType = 'accident' | 'congestion' | 'road_closure' | 'waterlogging' | 'procession';

export type DisruptionStatus = 'active' | 'cleared';

export interface ConstructionZone {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  severity: Severity;
  zone_type: ZoneType;
  status: ZoneStatus;
  start_date: string | null;
  end_date: string | null;
  affected_roads: string[];
  created_at: string;
  updated_at: string;
}

export interface TrafficDisruption {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  disruption_type: DisruptionType;
  severity: Severity;
  status: DisruptionStatus;
  reported_at: string;
  cleared_at: string | null;
  affected_roads: string[];
  created_at: string;
}

export interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  origin_lat: number;
  origin_lng: number;
  origin_label: string;
  dest_lat: number;
  dest_lng: number;
  dest_label: string;
  waypoints: { lat: number; lng: number }[];
  avoid_zones: string[];
  created_at: string;
}

export interface RouteStep {
  instruction: string;
  road: string;
  distance_km: number;
  duration_min: number;
  lat: number;
  lng: number;
  icon: 'start' | 'turn' | 'straight' | 'arrive' | 'avoid' | 'merge';
}

export interface RouteSuggestion {
  name: string;
  description: string;
  distance_km: number;
  estimated_time_min: number;
  safety_score: number;
  waypoints: [number, number][];
  avoid_zones: string[];
  color: string;
  steps: RouteStep[];
  zones_avoided: number;
  zones_on_route: number;
  disruptions_nearby: number;
}

export interface RouteRequest {
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  zones: ConstructionZone[];
  disruptions: TrafficDisruption[];
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export const SEVERITY_BG: Record<Severity, string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  metro_construction: 'Metro Construction',
  road_repair: 'Road Repair',
  utility_work: 'Utility Work',
  event: 'Event',
};

export const DISRUPTION_TYPE_LABELS: Record<DisruptionType, string> = {
  accident: 'Accident',
  congestion: 'Congestion',
  road_closure: 'Road Closure',
  waterlogging: 'Waterlogging',
  procession: 'Procession',
};

export const NAGPUR_CENTER: [number, number] = [21.1458, 79.0882];
export const NAGPUR_ZOOM = 13;
