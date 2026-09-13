import type { UserRole } from '@/lib/database.types';
import type { DemoIdentity } from './types';

/** Stable ids shared by every seed file so rows reference each other consistently. */
export const DEMO_IDS = {
  carrier: 'demo-carrier',
  carrier2: 'demo-carrier-2',
  carrier3: 'demo-carrier-3',
  broker: 'demo-broker',
  shipper: 'demo-shipper',
  driver: 'demo-driver',
  driver2: 'demo-driver-2',
  driver3: 'demo-driver-3',
  admin: 'demo-admin',
  carrierCompany: 'demo-company-carrier',
  carrier2Company: 'demo-company-carrier-2',
  carrier3Company: 'demo-company-carrier-3',
  brokerCompany: 'demo-company-broker',
  shipperCompany: 'demo-company-shipper',
  platformCompany: 'demo-company-platform',
} as const;

export type DemoRole = 'carrier' | 'broker' | 'shipper' | 'driver' | 'admin';

export const DEMO_IDENTITIES: Record<DemoRole, DemoIdentity> = {
  carrier: {
    id: DEMO_IDS.carrier,
    email: 'carrier@dispatchrelay.co',
    role: 'carrier',
    fullName: 'Marcus Rivera',
    companyId: DEMO_IDS.carrierCompany,
  },
  broker: {
    id: DEMO_IDS.broker,
    email: 'broker@dispatchrelay.co',
    role: 'broker',
    fullName: 'Sarah Chen',
    companyId: DEMO_IDS.brokerCompany,
  },
  shipper: {
    id: DEMO_IDS.shipper,
    email: 'shipper@dispatchrelay.co',
    role: 'shipper',
    fullName: 'James Park',
    companyId: DEMO_IDS.shipperCompany,
  },
  driver: {
    id: DEMO_IDS.driver,
    email: 'driver@dispatchrelay.co',
    role: 'driver',
    fullName: 'Carlos Mendez',
    companyId: DEMO_IDS.carrierCompany,
  },
  admin: {
    id: DEMO_IDS.admin,
    email: 'admin@dispatchrelay.co',
    role: 'admin',
    fullName: 'Admin User',
    companyId: DEMO_IDS.platformCompany,
  },
};

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === 'string' && value in DEMO_IDENTITIES;
}

export function demoIdentityFor(role: UserRole): DemoIdentity {
  return isDemoRole(role) ? DEMO_IDENTITIES[role] : DEMO_IDENTITIES.carrier;
}
