import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { ConstructionZone, TrafficDisruption, RouteSuggestion } from '../lib/types';
import { SEVERITY_COLORS, ZONE_TYPE_LABELS, DISRUPTION_TYPE_LABELS } from '../lib/types';

interface MapComponentProps {
  zones: ConstructionZone[];
  disruptions: TrafficDisruption[];
  selectedRoute: RouteSuggestion | null;
  allRoutes?: RouteSuggestion[];
  onMapClick?: (lat: number, lng: number) => void;
}

const ZONE_COLORS: Record<string, string> = {
  metro_construction: '#3b82f6',
  road_repair: '#f59e0b',
  utility_work: '#8b5cf6',
  event: '#06b6d4',
};

const DISRUPTION_COLORS: Record<string, string> = {
  accident: '#ef4444',
  congestion: '#f97316',
  road_closure: '#dc2626',
  waterlogging: '#0ea5e9',
  procession: '#a855f7',
};

export default function MapComponent({ zones, disruptions, selectedRoute, allRoutes, onMapClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const zonesLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const disruptionsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !mapContainerRef.current) return;
    initializedRef.current = true;

    const map = L.map(mapContainerRef.current, {
      center: [21.1458, 79.0882],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    zonesLayerRef.current.addTo(map);
    disruptionsLayerRef.current.addTo(map);
    routeLayerRef.current.addTo(map);

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      initializedRef.current = false;
    };
  }, []);

  // Render construction zones
  useEffect(() => {
    if (!mapRef.current) return;
    const layer = zonesLayerRef.current;
    layer.clearLayers();

    zones.forEach(zone => {
      if (zone.status === 'completed') return;

      const color = ZONE_COLORS[zone.zone_type] || '#3b82f6';
      const severityColor = SEVERITY_COLORS[zone.severity];

      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius_meters,
        color: color,
        fillColor: color,
        fillOpacity: zone.status === 'planned' ? 0.08 : 0.15,
        weight: 2,
        dashArray: zone.status === 'planned' ? '6, 6' : undefined,
      });

      const popup = L.popup({ className: 'zone-popup', maxWidth: 280 }).setContent(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${severityColor};"></span>
            <strong style="font-size:14px;color:#1e293b;">${zone.name}</strong>
          </div>
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">${zone.description}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
            <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${color}20;color:${color};border:1px solid ${color}40;">${ZONE_TYPE_LABELS[zone.zone_type]}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${severityColor}20;color:${severityColor};border:1px solid ${severityColor}40;">${zone.severity}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;">${zone.status}</span>
          </div>
          ${zone.affected_roads.length > 0 ? `<div style="font-size:11px;color:#64748b;">Affected: ${zone.affected_roads.join(', ')}</div>` : ''}
          ${zone.end_date ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">Expected completion: ${new Date(zone.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>` : ''}
        </div>
      `);

      circle.bindPopup(popup);
      circle.addTo(layer);
    });
  }, [zones]);

  // Render disruptions
  useEffect(() => {
    if (!mapRef.current) return;
    const layer = disruptionsLayerRef.current;
    layer.clearLayers();

    disruptions.forEach(d => {
      if (d.status !== 'active') return;

      const color = DISRUPTION_COLORS[d.disruption_type] || '#f97316';
      const severityColor = SEVERITY_COLORS[d.severity];

      const icon = L.divIcon({
        className: 'disruption-marker',
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:${color};border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          position:relative;
        ">
          <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
          <div style="
            position:absolute;inset:-4px;border-radius:50%;
            border:2px solid ${color};opacity:0.4;
            animation:pulse-ring 2s infinite;
          "></div>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([d.latitude, d.longitude], { icon });

      const popup = L.popup({ className: 'disruption-popup', maxWidth: 280 }).setContent(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${severityColor};"></span>
            <strong style="font-size:14px;color:#1e293b;">${d.title}</strong>
          </div>
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">${d.description}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
            <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${color}20;color:${color};border:1px solid ${color}40;">${DISRUPTION_TYPE_LABELS[d.disruption_type]}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${severityColor}20;color:${severityColor};border:1px solid ${severityColor}40;">${d.severity}</span>
          </div>
          ${d.affected_roads.length > 0 ? `<div style="font-size:11px;color:#64748b;">Affected: ${d.affected_roads.join(', ')}</div>` : ''}
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Reported: ${new Date(d.reported_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `);

      marker.bindPopup(popup);
      marker.addTo(layer);
    });
  }, [disruptions]);

  // Render routes
  useEffect(() => {
    if (!mapRef.current) return;
    const layer = routeLayerRef.current;
    layer.clearLayers();

    if (!selectedRoute && (!allRoutes || allRoutes.length === 0)) return;

    const routesToRender = allRoutes || (selectedRoute ? [selectedRoute] : []);

    // Draw non-selected routes first (faded)
    routesToRender.forEach(route => {
      const isSelected = selectedRoute?.name === route.name;
      const latlngs: L.LatLngExpression[] = route.waypoints.map(
        ([lat, lng]) => [lat, lng] as L.LatLngExpression
      );

      if (!isSelected) {
        L.polyline(latlngs, {
          color: route.color,
          weight: 3,
          opacity: 0.3,
          lineJoin: 'round',
          lineCap: 'round',
          dashArray: '8, 8',
        }).addTo(layer);
      }
    });

    // Draw selected route on top
    if (selectedRoute) {
      const latlngs: L.LatLngExpression[] = selectedRoute.waypoints.map(
        ([lat, lng]) => [lat, lng] as L.LatLngExpression
      );

      // Shadow line for depth
      L.polyline(latlngs, {
        color: '#000000',
        weight: 8,
        opacity: 0.1,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(layer);

      // Main route line
      const mainLine = L.polyline(latlngs, {
        color: selectedRoute.color,
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      });

      mainLine.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <strong style="font-size:14px;color:#1e293b;">${selectedRoute.name}</strong>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${selectedRoute.distance_km} km &middot; ~${selectedRoute.estimated_time_min} min</div>
          <div style="font-size:12px;color:#64748b;">Safety: ${selectedRoute.safety_score}/100</div>
        </div>
      `);

      mainLine.addTo(layer);

      // Animated dashed overlay for direction
      L.polyline(latlngs, {
        color: 'white',
        weight: 2,
        opacity: 0.5,
        dashArray: '4, 12',
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(layer);

      // Origin marker
      const originIcon = L.divIcon({
        className: 'origin-marker',
        html: `<div style="position:relative;">
          <div style="
            width:24px;height:24px;border-radius:50%;
            background:#22c55e;border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
          ">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div style="
            position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);
            white-space:nowrap;font-size:11px;font-weight:600;
            color:#22c55e;background:white;padding:1px 6px;
            border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);
          ">A</div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(latlngs[0], { icon: originIcon, zIndexOffset: 1000 })
        .bindPopup('<div style="font-family:Inter,sans-serif;"><strong>Origin</strong></div>')
        .addTo(layer);

      // Destination marker
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `<div style="position:relative;">
          <div style="
            width:24px;height:24px;border-radius:50%;
            background:#ef4444;border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
          ">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="
            position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);
            white-space:nowrap;font-size:11px;font-weight:600;
            color:#ef4444;background:white;padding:1px 6px;
            border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);
          ">B</div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(latlngs[latlngs.length - 1], { icon: destIcon, zIndexOffset: 1000 })
        .bindPopup('<div style="font-family:Inter,sans-serif;"><strong>Destination</strong></div>')
        .addTo(layer);

      // Waypoint dots along route
      for (let i = 1; i < latlngs.length - 1; i++) {
        const dotIcon = L.divIcon({
          className: 'waypoint-dot',
          html: `<div style="
            width:8px;height:8px;border-radius:50%;
            background:${selectedRoute.color};border:2px solid white;
            box-shadow:0 1px 3px rgba(0,0,0,0.2);
          "></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        });
        L.marker(latlngs[i], { icon: dotIcon, zIndexOffset: 500 }).addTo(layer);
      }

      // Fit map to route bounds
      if (latlngs.length >= 2) {
        mapRef.current.fitBounds(mainLine.getBounds(), { padding: [80, 80], maxZoom: 15 });
      }
    }
  }, [selectedRoute, allRoutes]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
