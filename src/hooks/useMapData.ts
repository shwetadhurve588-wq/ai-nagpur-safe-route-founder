import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ConstructionZone, TrafficDisruption } from '../lib/types';

export function useMapData() {
  const [zones, setZones] = useState<ConstructionZone[]>([]);
  const [disruptions, setDisruptions] = useState<TrafficDisruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('construction_zones')
      .select('*')
      .order('severity', { ascending: false });

    if (err) {
      setError(err.message);
      return [];
    }
    return (data as ConstructionZone[]) || [];
  }, []);

  const fetchDisruptions = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('traffic_disruptions')
      .select('*')
      .eq('status', 'active')
      .order('severity', { ascending: false });

    if (err) {
      setError(err.message);
      return [];
    }
    return (data as TrafficDisruption[]) || [];
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [z, d] = await Promise.all([fetchZones(), fetchDisruptions()]);
      setZones(z);
      setDisruptions(d);
      setLoading(false);
    };
    loadData();

    const zoneChannel = supabase
      .channel('zones-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'construction_zones' }, () => {
        fetchZones().then(setZones);
      })
      .subscribe();

    const disruptionChannel = supabase
      .channel('disruptions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traffic_disruptions' }, () => {
        fetchDisruptions().then(setDisruptions);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(zoneChannel);
      supabase.removeChannel(disruptionChannel);
    };
  }, [fetchZones, fetchDisruptions]);

  return { zones, disruptions, loading, error };
}
