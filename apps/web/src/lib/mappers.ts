/**
 * Converts Supabase snake_case rows to camelCase shared types.
 * This keeps the LoadCard and existing UI components unchanged.
 */
import type { Load, Truck, TrackingMilestone } from '@freightx/shared';
import type { LoadRow, TruckRow, TrackingMilestoneRow } from './database.types';

export function rowToLoad(row: LoadRow): Load {
  return {
    id: row.id,
    loadNumber: row.load_number,
    postedBy: row.posted_by ?? '',
    companyName: row.company_name,
    originCity: row.origin_city,
    originState: row.origin_state,
    originAddress: row.origin_address ?? undefined,
    originZip: row.origin_zip ?? undefined,
    destCity: row.dest_city,
    destState: row.dest_state,
    destAddress: row.dest_address ?? undefined,
    destZip: row.dest_zip ?? undefined,
    pickupDate: row.pickup_date,
    deliveryDate: row.delivery_date,
    equipment: row.equipment,
    commodity: row.commodity,
    weightLbs: row.weight_lbs,
    rateUsd: row.rate_usd,
    ratePerMile: row.rate_per_mile ?? 0,
    totalMiles: row.total_miles ?? undefined,
    status: row.status,
    bidCount: row.bid_count,
    hazmat: row.hazmat,
    tempControlled: row.temp_controlled,
    postedAt: row.posted_at,
    brokerCreditScore: row.broker_credit_score ?? undefined,
    assignedDriverId: row.assigned_driver_id ?? undefined,
  };
}

export function rowToTruck(row: TruckRow): Truck {
  return {
    id: row.id,
    postedBy: row.posted_by ?? '',
    companyName: row.company_name,
    originCity: row.origin_city,
    originState: row.origin_state,
    destCity: row.dest_city ?? undefined,
    destState: row.dest_state ?? undefined,
    availableDate: row.available_date,
    equipment: row.equipment,
    lengthFt: row.length_ft ?? undefined,
    weightCapacityLbs: row.weight_capacity_lbs ?? undefined,
    driverName: row.driver_name ?? undefined,
    driverPhone: row.driver_phone ?? undefined,
    driverId: row.driver_id ?? undefined,
    status: row.status,
  };
}

export function rowToMilestone(row: TrackingMilestoneRow): TrackingMilestone {
  return {
    label: row.label,
    location: row.location,
    timestamp: row.milestone_timestamp ?? '',
    completed: row.completed,
    current: row.current,
  };
}
