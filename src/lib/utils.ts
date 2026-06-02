export interface GpsPoint {
  lat: number;
  lon: number;
  timestamp: string;
  speed: number;
  heading: number;
  mode: string;
}

export type MovementMode = 'walking' | 'driving' | 'running' | 'bike';

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1R = (lat1 * Math.PI) / 180;
  const lat2R = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatSpeed(mps: number): string {
  const kph = mps * 3.6;
  return `${kph.toFixed(1)} km/h`;
}

export function generateSessionId(): string {
  return `naija_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Convert displacement in meters to new GPS coordinates
 * dx: displacement in meters (East-West, positive = East)
 * dy: displacement in meters (North-South, positive = North)
 */
export function displacementToCoordinates(
  lat: number,
  lon: number,
  dx: number,
  dy: number
): { lat: number; lon: number } {
  const R = 6371000; // Earth radius in meters
  const lat_rad = (lat * Math.PI) / 180;

  // Convert meters to degrees
  const dlat = (dy / R) * (180 / Math.PI);
  const dlon = (dx / (R * Math.cos(lat_rad))) * (180 / Math.PI);

  return {
    lat: lat + dlat,
    lon: lon + dlon
  };
}

/**
 * Convert GPS coordinates to displacement in meters
 * Inverse of displacementToCoordinates
 */
export function coordinatesToDisplacement(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { dx: number; dy: number } {
  const R = 6371000; // Earth radius in meters
  const lat1_rad = (lat1 * Math.PI) / 180;
  const lat2_rad = (lat2 * Math.PI) / 180;
  const dlon_rad = ((lon2 - lon1) * Math.PI) / 180;
  const dlat_rad = ((lat2 - lat1) * Math.PI) / 180;

  const dy = dlat_rad * R;
  const dx = dlon_rad * R * Math.cos(lat1_rad);

  return {
    dx: parseFloat(dx.toFixed(2)),
    dy: parseFloat(dy.toFixed(2))
  };
}
