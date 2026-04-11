/**
 * Deadhead Optimization Service
 *
 * Finds the closest available drivers to pickup locations,
 * minimizing empty miles and improving fleet utilization.
 *
 * Example:
 *   const nearbyDrivers = await findNearestDrivers(
 *     36.1627, // Nashville pickup lat
 *     -86.7816, // Nashville pickup lng
 *     100      // Search within 100 miles
 *   );
 *
 *   // Returns drivers sorted by distance, with ETA calculation
 */

import { supabase } from '@/lib/supabase';

export interface NearestDriver {
  driver_id: string;
  driver_name: string;
  distance_miles: number;
  duty_status: 'on_duty' | 'off_duty' | 'sleeper' | 'driving';
  last_update: string;
  coords_lat: number;
  coords_lng: number;
  eta_minutes?: number; // Estimated time to reach pickup
}

/**
 * Find nearest available drivers to a pickup location
 *
 * @param pickupLat - Pickup latitude
 * @param pickupLng - Pickup longitude
 * @param maxDistanceMiles - Maximum search radius (default 100 miles)
 * @param limit - Maximum number of results (default 10)
 * @returns Array of drivers sorted by distance (closest first)
 */
export async function findNearestDrivers(
  pickupLat: number,
  pickupLng: number,
  maxDistanceMiles: number = 100,
  limit: number = 10,
): Promise<NearestDriver[]> {
  try {
    const { data, error } = await (supabase.rpc as any)('find_nearest_available_drivers', {
      p_pickup_lat: pickupLat,
      p_pickup_lng: pickupLng,
      p_max_distance_miles: maxDistanceMiles,
      p_limit: limit,
    });

    if (error) throw error;

    if (!data || (data as any[]).length === 0) {
      return [];
    }

    // Add ETA calculation (simple: distance / avg_speed)
    const drivers = (data as any[]).map((driver: NearestDriver) => ({
      ...driver,
      eta_minutes: calculateETA(driver.distance_miles, driver.duty_status),
    }));

    return drivers;
  } catch (error) {
    console.error('[DeadheadOptimizer] Failed to find nearest drivers:', error);
    return [];
  }
}

/**
 * Calculate estimated time to arrival
 *
 * @param distanceMiles - Distance in miles
 * @param dutyStatus - Driver's current duty status
 * @returns Estimated minutes to reach pickup
 */
function calculateETA(distanceMiles: number, dutyStatus: string): number {
  // Average speeds by duty status
  const avgSpeed = dutyStatus === 'driving' ? 55 : 45; // mph

  // Convert to minutes
  const hours = distanceMiles / avgSpeed;
  return Math.round(hours * 60);
}

/**
 * Find best driver for a load (considering distance, availability, and rating)
 *
 * @param pickupLat - Pickup latitude
 * @param pickupLng - Pickup longitude
 * @param requiredEquipment - Equipment type needed (optional filter)
 * @returns Single best driver recommendation
 */
export async function findBestDriverForLoad(
  pickupLat: number,
  pickupLng: number,
  requiredEquipment?: string,
): Promise<NearestDriver | null> {
  const nearbyDrivers = await findNearestDrivers(pickupLat, pickupLng, 150, 20);

  if (nearbyDrivers.length === 0) return null;

  // TODO: Add equipment type filtering when driver equipment data is available
  // TODO: Add driver rating/score to selection criteria

  // For now, return closest available driver
  return nearbyDrivers[0];
}

/**
 * Calculate deadhead miles for a driver to a pickup location
 *
 * @param driverLat - Driver's current latitude
 * @param driverLng - Driver's current longitude
 * @param pickupLat - Pickup latitude
 * @param pickupLng - Pickup longitude
 * @returns Deadhead distance in miles (straight-line approximation)
 */
export function calculateDeadheadMiles(
  driverLat: number,
  driverLng: number,
  pickupLat: number,
  pickupLng: number,
): number {
  // Haversine formula for great-circle distance
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(pickupLat - driverLat);
  const dLng = toRadians(pickupLng - driverLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(driverLat)) *
      Math.cos(toRadians(pickupLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get deadhead optimization suggestions for carrier
 *
 * Analyzes upcoming loads and suggests which drivers to assign
 * to minimize total deadhead miles.
 *
 * @param carrierId - Carrier ID
 * @returns Load-driver assignment suggestions
 */
export async function getDeadheadOptimizationSuggestions(carrierId: string): Promise<
  {
    loadNumber: string;
    pickupLocation: string;
    suggestedDriver: NearestDriver | null;
    potentialSavings: number; // miles saved vs. random assignment
  }[]
> {
  // TODO: Implement full optimization algorithm
  // This would fetch all unassigned loads for carrier,
  // find nearest drivers for each,
  // and solve assignment problem to minimize total deadhead

  console.log('[DeadheadOptimizer] Optimization suggestions not yet implemented');
  return [];
}
