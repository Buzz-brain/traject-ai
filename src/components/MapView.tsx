import { useEffect, useRef } from 'react';
import type { GpsPoint } from '../lib/utils';

interface PredictedPoint {
  lat: number;
  lon: number;
  timestamp: string;
  predicted: boolean;
}

interface Props {
  points: GpsPoint[];
  currentPos: { lat: number; lon: number } | null;
  predictedPoints?: PredictedPoint[];
  showPredicted?: boolean;
}

const NIGERIA_CENTER: [number, number] = [9.082, 8.6753];
const DEFAULT_ZOOM = 15;

export function MapView({ points, currentPos, predictedPoints = [], showPredicted = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const polylineRef = useRef<import('leaflet').Polyline | null>(null);
  const predictedPolylineRef = useRef<import('leaflet').Polyline | null>(null);
  const markerRef = useRef<import('leaflet').CircleMarker | null>(null);
  const predictionMarkerRef = useRef<import('leaflet').CircleMarker | null>(null);

  useEffect(() => {
    let L: typeof import('leaflet');

    async function initMap() {
      const leaflet = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      L = leaflet.default ?? leaflet;

      if (!containerRef.current || mapRef.current) return;

      const center = currentPos
        ? ([currentPos.lat, currentPos.lon] as [number, number])
        : NIGERIA_CENTER;

      const map = L.map(containerRef.current, {
        center,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ prefix: '© OSM' }).addTo(map);

      // GPS polyline (solid green)
      polylineRef.current = L.polyline([], { color: '#10b981', weight: 4, opacity: 0.8 }).addTo(map);
      
      // Predicted polyline (dashed purple)
      predictedPolylineRef.current = L.polyline([], { 
        color: '#a855f7', 
        weight: 3, 
        opacity: 0.6,
        dashArray: '5, 5'
      }).addTo(map);
      
      // Current position marker (green)
      markerRef.current = L.circleMarker(center, {
        radius: 8,
        fillColor: '#10b981',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);
      
      // Prediction marker (purple)
      predictionMarkerRef.current = L.circleMarker(center, {
        radius: 6,
        fillColor: '#a855f7',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
      }).addTo(map);

      mapRef.current = map;
    }

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update polyline when points change
  useEffect(() => {
    if (!mapRef.current || !polylineRef.current) return;
    const latlngs = points.map((p) => [p.lat, p.lon] as [number, number]);
    polylineRef.current.setLatLngs(latlngs);
  }, [points]);

  // update current position marker
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !currentPos) return;
    const ll: [number, number] = [currentPos.lat, currentPos.lon];
    markerRef.current.setLatLng(ll);
    mapRef.current.setView(ll, mapRef.current.getZoom(), { animate: true });
  }, [currentPos]);

  // update predicted polyline when predicted points change
  useEffect(() => {
    if (!mapRef.current || !predictedPolylineRef.current) return;
    if (!showPredicted || predictedPoints.length === 0) {
      predictedPolylineRef.current.setLatLngs([]);
      if (predictionMarkerRef.current) {
        const emptyPos: [number, number] = [0, 0];
        predictionMarkerRef.current.setLatLng(emptyPos);
      }
      return;
    }
    const predictedLatlngs = predictedPoints.map((p) => [p.lat, p.lon] as [number, number]);
    predictedPolylineRef.current.setLatLngs(predictedLatlngs);
    
    // Update prediction marker to latest predicted position
    if (predictedPoints.length > 0 && predictionMarkerRef.current) {
      const lastPredicted = predictedPoints[predictedPoints.length - 1];
      predictionMarkerRef.current.setLatLng([lastPredicted.lat, lastPredicted.lon]);
    }
  }, [predictedPoints, showPredicted]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: 240 }}
    />
  );
}
