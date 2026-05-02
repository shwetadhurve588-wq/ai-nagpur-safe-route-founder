import { useState, useCallback } from 'react';
import type { ConstructionZone, TrafficDisruption, RouteSuggestion, RouteStep } from '../lib/types';

const NAGPUR_LANDMARKS: Record<string, { coords: [number, number]; roads: string[] }> = {
  'sitabuldi': { coords: [21.1458, 79.0882], roads: ['Sitabuldi Main Road', 'Central Avenue'] },
  'dharampeth': { coords: [21.1520, 79.0720], roads: ['Dharampeth Road', 'West High Court Road'] },
  'civil lines': { coords: [21.1600, 79.0900], roads: ['Civil Lines Road', 'Sadar Bazaar Road'] },
  'medical square': { coords: [21.1490, 79.0990], roads: ['Medical Square', 'Umesh Nagar Road'] },
  'lic chowk': { coords: [21.1465, 79.0910], roads: ['LIC Chowk', 'Central Avenue'] },
  'ajni': { coords: [21.1350, 79.0830], roads: ['Ajni Road', 'Wardha Road'] },
  'dhantoli': { coords: [21.1410, 79.0700], roads: ['Dhantoli Road', 'Bajaj Nagar Road'] },
  'ramdaspeth': { coords: [21.1500, 79.0780], roads: ['Ramdaspeth Road', 'South Ambazari Road'] },
  'ravi nagar': { coords: [21.1550, 79.0750], roads: ['Ravi Nagar Road', 'Manewada Road'] },
  'wardha road': { coords: [21.1380, 79.1050], roads: ['Wardha Road', 'NH-44'] },
  'hingna': { coords: [21.1200, 79.0400], roads: ['Hingna Road', 'Narendra Nagar Road'] },
  'mihan': { coords: [21.0950, 79.0650], roads: ['MIHAN Road', 'Jewel Airport Road'] },
  'airport': { coords: [21.0925, 79.0480], roads: ['Airport Road', 'Wardha Road Extension'] },
  'gandhibagh': { coords: [21.1300, 79.0850], roads: ['Gandhibagh Road', 'Itwari Road'] },
  'pardi': { coords: [21.1750, 79.1100], roads: ['Pardi Road', 'Kamptee Road'] },
  'mahal': { coords: [21.1280, 79.0950], roads: ['Mahal Road', 'Joshi Road'] },
  'panchsheel chowk': { coords: [21.1420, 79.0650], roads: ['Panchsheel Chowk', 'Amravati Road'] },
  'ambazari': { coords: [21.1480, 79.0600], roads: ['Ambazari Road', 'South Ambazari Road'] },
  'sadar': { coords: [21.1580, 79.0850], roads: ['Sadar Bazaar Road', 'Civil Lines Road'] },
  'itwari': { coords: [21.1320, 79.0920], roads: ['Itwari Road', 'Gandhibagh Road'] },
  'besa': { coords: [21.1050, 79.0200], roads: ['Besa Road', 'Beltarodi Road'] },
  'beltarodi': { coords: [21.1100, 79.0300], roads: ['Beltarodi Road', 'Manewada Road'] },
  'narendra nagar': { coords: [21.1250, 79.0500], roads: ['Narendra Nagar Road', 'Hingna Road'] },
  'manewada': { coords: [21.1600, 79.0700], roads: ['Manewada Road', 'Ravi Nagar Road'] },
  'kamptee road': { coords: [21.1700, 79.1150], roads: ['Kamptee Road', 'Pardi Road'] },
  'laxmi nagar': { coords: [21.1480, 79.0750], roads: ['Laxmi Nagar Road', 'Manewada Road'] },
  'sonegaon': { coords: [21.1380, 79.0700], roads: ['Sonegaon Road', 'Dhantoli Road'] },
  'pratap nagar': { coords: [21.1150, 79.0550], roads: ['Pratap Nagar Road', 'Hingna Road'] },
  'wadi': { coords: [21.1700, 79.0800], roads: ['Wadi Road', 'Kamptee Road'] },
};

function geocodeLocation(input: string): { coords: [number, number]; roads: string[] } | null {
  const normalized = input.toLowerCase().trim();
  for (const [key, data] of Object.entries(NAGPUR_LANDMARKS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return data;
    }
  }
  const coordMatch = input.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    return { coords: [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])], roads: ['Unknown Road'] };
  }
  return null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lineIntersectsZone(
  lat1: number, lng1: number, lat2: number, lng2: number,
  zone: ConstructionZone
): boolean {
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    if (haversineDistance(lat, lng, zone.latitude, zone.longitude) * 1000 < zone.radius_meters) {
      return true;
    }
  }
  return false;
}

function routeIntersectsZones(
  waypoints: [number, number][],
  zones: ConstructionZone[]
): ConstructionZone[] {
  const hit = new Set<string>();
  const result: ConstructionZone[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    for (const zone of zones) {
      if (!hit.has(zone.id) && lineIntersectsZone(waypoints[i][0], waypoints[i][1], waypoints[i + 1][0], waypoints[i + 1][1], zone)) {
        hit.add(zone.id);
        result.push(zone);
      }
    }
  }
  return result;
}

function countNearbyDisruptions(
  waypoints: [number, number][],
  disruptions: TrafficDisruption[],
  radiusKm: number = 1.0
): number {
  let count = 0;
  for (const d of disruptions) {
    if (d.status !== 'active') continue;
    for (const wp of waypoints) {
      if (haversineDistance(wp[0], wp[1], d.latitude, d.longitude) < radiusKm) {
        count++;
        break;
      }
    }
  }
  return count;
}

function generateSteps(
  waypoints: [number, number][],
  originRoads: string[],
  destRoads: string[],
  zonesOnRoute: ConstructionZone[]
): RouteStep[] {
  const steps: RouteStep[] = [];
  const totalSegments = waypoints.length - 1;

  steps.push({
    instruction: 'Start from your location',
    road: originRoads[0] || 'Current Road',
    distance_km: 0,
    duration_min: 0,
    lat: waypoints[0][0],
    lng: waypoints[0][1],
    icon: 'start',
  });

  for (let i = 0; i < totalSegments; i++) {
    const segDist = haversineDistance(
      waypoints[i][0], waypoints[i][1],
      waypoints[i + 1][0], waypoints[i + 1][1]
    );
    const segDuration = segDist / 0.4;

    const nearZone = zonesOnRoute.find(z =>
      haversineDistance(waypoints[i + 1][0], waypoints[i + 1][1], z.latitude, z.longitude) * 1000 < z.radius_meters * 1.5
    );

    if (nearZone) {
      steps.push({
        instruction: `Caution: ${nearZone.name} ahead - consider alternate lane`,
        road: nearZone.affected_roads[0] || 'Main Road',
        distance_km: Math.round(segDist * 10) / 10,
        duration_min: Math.round(segDuration),
        lat: waypoints[i + 1][0],
        lng: waypoints[i + 1][1],
        icon: 'avoid',
      });
    } else if (i === totalSegments - 1) {
      steps.push({
        instruction: 'Turn toward destination area',
        road: destRoads[0] || 'Destination Road',
        distance_km: Math.round(segDist * 10) / 10,
        duration_min: Math.round(segDuration),
        lat: waypoints[i + 1][0],
        lng: waypoints[i + 1][1],
        icon: 'turn',
      });
    } else if (i === 0) {
      steps.push({
        instruction: 'Head toward main road',
        road: originRoads[0] || 'Main Road',
        distance_km: Math.round(segDist * 10) / 10,
        duration_min: Math.round(segDuration),
        lat: waypoints[i + 1][0],
        lng: waypoints[i + 1][1],
        icon: 'straight',
      });
    } else {
      const bearing = Math.atan2(
        waypoints[i + 1][1] - waypoints[i][1],
        waypoints[i + 1][0] - waypoints[i][0]
      );
      const prevBearing = Math.atan2(
        waypoints[i][1] - waypoints[i - 1][1],
        waypoints[i][0] - waypoints[i - 1][0]
      );
      const turnAngle = ((bearing - prevBearing) * 180) / Math.PI;
      const isLeft = turnAngle < -30;
      const isRight = turnAngle > 30;

      steps.push({
        instruction: isLeft ? 'Turn left' : isRight ? 'Turn right' : 'Continue straight',
        road: `Segment ${i + 1} Road`,
        distance_km: Math.round(segDist * 10) / 10,
        duration_min: Math.round(segDuration),
        lat: waypoints[i + 1][0],
        lng: waypoints[i + 1][1],
        icon: isLeft || isRight ? 'turn' : 'straight',
      });
    }
  }

  steps.push({
    instruction: 'Arrive at your destination',
    road: destRoads[0] || 'Destination Road',
    distance_km: 0,
    duration_min: 0,
    lat: waypoints[waypoints.length - 1][0],
    lng: waypoints[waypoints.length - 1][1],
    icon: 'arrive',
  });

  return steps;
}

function interpolateWaypoints(start: [number, number], end: [number, number], count: number): [number, number][] {
  const result: [number, number][] = [start];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    result.push([
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ]);
  }
  result.push(end);
  return result;
}

function generateRoutes(
  origin: { coords: [number, number]; roads: string[] },
  destination: { coords: [number, number]; roads: string[] },
  zones: ConstructionZone[],
  disruptions: TrafficDisruption[]
): RouteSuggestion[] {
  const o = origin.coords;
  const d = destination.coords;
  const directDist = haversineDistance(o[0], o[1], d[0], d[1]);
  const activeZones = zones.filter(z => z.status === 'active');

  const dLat = d[0] - o[0];
  const dLng = d[1] - o[1];
  const perpLat = -dLng * 0.3;
  const perpLng = dLat * 0.3;

  const routeConfigs: {
    name: string;
    waypoints: [number, number][];
    color: string;
  }[] = [
    {
      name: 'Fastest Route',
      waypoints: interpolateWaypoints(o, d, 3),
      color: '#3b82f6',
    },
    {
      name: 'Safest Route',
      waypoints: [
        o,
        [o[0] + dLat * 0.25 + perpLat * 0.4, o[1] + dLng * 0.25 + perpLng * 0.4],
        [o[0] + dLat * 0.5 + perpLat * 0.5, o[1] + dLng * 0.5 + perpLng * 0.5],
        [o[0] + dLat * 0.75 + perpLat * 0.3, o[1] + dLng * 0.75 + perpLng * 0.3],
        d,
      ],
      color: '#22c55e',
    },
    {
      name: 'Alternate Route',
      waypoints: [
        o,
        [o[0] + dLat * 0.25 - perpLat * 0.35, o[1] + dLng * 0.25 - perpLng * 0.35],
        [o[0] + dLat * 0.5 - perpLat * 0.45, o[1] + dLng * 0.5 - perpLng * 0.45],
        [o[0] + dLat * 0.75 - perpLat * 0.25, o[1] + dLng * 0.75 - perpLng * 0.25],
        d,
      ],
      color: '#f59e0b',
    },
  ];

  const routes: RouteSuggestion[] = routeConfigs.map(config => {
    const zonesOnRoute = routeIntersectsZones(config.waypoints, activeZones);
    const zonesAvoided = activeZones.length - zonesOnRoute.length;
    const nearbyDisruptions = countNearbyDisruptions(config.waypoints, disruptions);
    const totalDist = config.waypoints.reduce((acc, wp, i) =>
      i === 0 ? 0 : acc + haversineDistance(config.waypoints[i - 1][0], config.waypoints[i - 1][1], wp[0], wp[1]), 0
    );
    const extraDist = Math.max(0, totalDist - directDist * 1.3);
    const safetyScore = Math.max(0, Math.min(100,
      100 - zonesOnRoute.filter(z => z.severity === 'critical').length * 35
           - zonesOnRoute.filter(z => z.severity === 'high').length * 25
           - zonesOnRoute.filter(z => z.severity === 'medium').length * 15
           - zonesOnRoute.filter(z => z.severity === 'low').length * 5
           - nearbyDisruptions * 8
           - extraDist * 5
    ));

    const steps = generateSteps(config.waypoints, origin.roads, destination.roads, zonesOnRoute);

    const avgSpeed = safetyScore > 70 ? 0.45 : safetyScore > 40 ? 0.35 : 0.25;
    const estTime = Math.round(totalDist / avgSpeed);

    return {
      name: config.name,
      description: zonesOnRoute.length === 0
        ? `Clean route with no active construction zones. ${nearbyDisruptions > 0 ? `${nearbyDisruptions} nearby disruption(s) to watch for.` : 'No nearby disruptions.'}`
        : `Passes through ${zonesOnRoute.length} construction zone(s). ${zonesAvoided > 0 ? `Avoids ${zonesAvoided} other zone(s).` : ''}`,
      distance_km: Math.round(totalDist * 10) / 10,
      estimated_time_min: estTime,
      safety_score: Math.round(safetyScore),
      waypoints: config.waypoints,
      avoid_zones: zonesOnRoute.map(z => z.id),
      color: config.color,
      steps,
      zones_avoided: zonesAvoided,
      zones_on_route: zonesOnRoute.length,
      disruptions_nearby: nearbyDisruptions,
    };
  });

  routes.sort((a, b) => {
    if (a.name === 'Safest Route') return -1;
    if (b.name === 'Safest Route') return 1;
    return b.safety_score - a.safety_score;
  });

  const safest = routes.find(r => r.name === 'Safest Route');
  if (safest && safest.safety_score >= routes[0].safety_score && safest !== routes[0]) {
    const idx = routes.indexOf(safest);
    routes.splice(idx, 1);
    routes.unshift(safest);
  }

  return routes;
}

export function useRoutePlanner(
  zones: ConstructionZone[],
  disruptions: TrafficDisruption[]
) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState<RouteSuggestion[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteSuggestion | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const calculateRoutes = useCallback(() => {
    setRouteError(null);
    setRoutes([]);
    setSelectedRoute(null);

    const originData = geocodeLocation(origin);
    const destData = geocodeLocation(destination);

    if (!originData) {
      setRouteError('Could not find origin. Try a Nagpur landmark like "Sitabuldi", "Dharampeth", or "Airport".');
      return;
    }
    if (!destData) {
      setRouteError('Could not find destination. Try a Nagpur landmark like "Civil Lines", "Medical Square", or "MIHAN".');
      return;
    }
    if (haversineDistance(originData.coords[0], originData.coords[1], destData.coords[0], destData.coords[1]) < 0.3) {
      setRouteError('Origin and destination are too close. Please choose different locations.');
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      const result = generateRoutes(originData, destData, zones, disruptions);
      setRoutes(result);
      setSelectedRoute(result[0]);
      setIsCalculating(false);
    }, 600);
  }, [origin, destination, zones, disruptions]);

  const clearRoutes = useCallback(() => {
    setRoutes([]);
    setSelectedRoute(null);
    setRouteError(null);
  }, []);

  return {
    origin, setOrigin,
    destination, setDestination,
    routes, selectedRoute, setSelectedRoute,
    isCalculating, routeError,
    calculateRoutes, clearRoutes,
  };
}
