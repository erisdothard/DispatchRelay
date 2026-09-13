/**
 * Carrier screens: fleet, map, availability, team, payments, invitations, alerts, RFPs,
 * fuel cards and spot rates. Seeds and handlers live in ./carrier/*.
 */
import type { DemoDomain } from '../types';
import { businessSeeds } from './carrier/business-seeds';
import { fleetSeeds } from './carrier/fleet-seeds';
import { CARRIER_FUNCTIONS, CARRIER_RPC } from './carrier/rpc';

export const carrierDomain: DemoDomain = {
  // The two seed groups own disjoint tables, so spreading them never overwrites rows.
  seeds: () => ({ ...fleetSeeds(), ...businessSeeds() }),
  rpc: CARRIER_RPC,
  functions: CARRIER_FUNCTIONS,
};
