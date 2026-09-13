import type { DemoDomain } from '../types';
import { expenseSeeds } from './driver/expenses';
import { HOS_RPC, hosSeeds } from './driver/hos';
import { TRACKING_RPC, trackingSeeds } from './driver/tracking';

/** Driver screens: dashboard, documents, tire log, receipts, expenses, HOS, GPS. */
export const driverDomain: DemoDomain = {
  seeds: () => ({
    ...hosSeeds(),
    ...expenseSeeds(),
    ...trackingSeeds(),
  }),
  rpc: {
    ...HOS_RPC,
    ...TRACKING_RPC,
  },
};
