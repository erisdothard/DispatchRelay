import { haversineM } from './geofence';

export type AnomalyType = 'teleport' | 'excessive_speed' | 'signal_loss';
export type AnomalySeverity = 'critical' | 'warning';

export interface AnomalyResult {
  type: AnomalyType;
  severity: AnomalySeverity;
  message: string;
}

interface Ping {
  latitude: number;
  longitude: number;
  speed_ms?: number | null;
  recorded_at: string;
}

/**
 * Detect GPS anomalies by comparing current ping to previous.
 * Returns detected anomalies (can be multiple).
 */
export function detectAnomalies(
  current: Ping,
  previous: Ping | null,
): AnomalyResult[] {
  if (!previous) return [];

  const anomalies: AnomalyResult[] = [];

  const distM = haversineM(
    previous.latitude,
    previous.longitude,
    current.latitude,
    current.longitude,
  );
  const timeDiffS =
    (new Date(current.recorded_at).getTime() - new Date(previous.recorded_at).getTime()) / 1000;

  // Teleport detection: >50km in <30 seconds + speed > 130 km/h
  if (timeDiffS > 0 && timeDiffS < 30 && distM > 50_000) {
    const speedKmh = (distM / timeDiffS) * 3.6;
    if (speedKmh > 130) {
      anomalies.push({
        type: 'teleport',
        severity: 'critical',
        message: `Suspicious location jump: ${Math.round(distM / 1000)}km in ${Math.round(timeDiffS)}s (${Math.round(speedKmh)} km/h)`,
      });
    }
  }

  // Excessive speed: >130 km/h (80 mph)
  if (current.speed_ms != null && current.speed_ms * 3.6 > 130) {
    anomalies.push({
      type: 'excessive_speed',
      severity: 'warning',
      message: `Excessive speed detected: ${Math.round(current.speed_ms * 3.6)} km/h`,
    });
  }

  // Signal loss: >5 minute gap
  if (timeDiffS > 300) {
    anomalies.push({
      type: 'signal_loss',
      severity: 'warning',
      message: `GPS signal gap: ${Math.round(timeDiffS / 60)} minutes without signal`,
    });
  }

  return anomalies;
}
