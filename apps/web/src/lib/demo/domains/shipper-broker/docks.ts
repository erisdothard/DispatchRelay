/**
 * Dock scheduling for Park Manufacturing: facilities, dock doors, today's appointments,
 * and the slot-availability / booking / check-in / check-out Postgres functions.
 */
import { DEMO_IDS } from '../../identities';
import { hoursAgo } from '../../time';
import type { DemoHandler, Row, SeedTables } from '../../types';
import { findById, nowIso, optionalStr, requireIdentity, str, todayUtcAt } from './helpers';

const SHIPPER_CO = DEMO_IDS.shipperCompany;
const OPEN_MINUTE = 6 * 60;
const CLOSE_MINUTE = 22 * 60;
const MINUTE_MS = 60_000;

const WEEKDAY = { open: '06:00', close: '22:00' };
const OPERATING_HOURS = {
  mon: WEEKDAY,
  tue: WEEKDAY,
  wed: WEEKDAY,
  thu: WEEKDAY,
  fri: WEEKDAY,
  sat: { open: '07:00', close: '15:00' },
};

function facility(
  id: string,
  name: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  extra: Row,
): Row {
  return {
    id,
    company_id: SHIPPER_CO,
    name,
    address,
    city,
    state,
    zip,
    lat: null,
    lng: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    operating_hours: OPERATING_HOURS,
    timezone: 'America/Detroit',
    active: true,
    created_at: hoursAgo(24 * 300),
    ...extra,
  };
}

const FACILITIES: Row[] = [
  facility('fac-detroit', 'Detroit Assembly Plant', '8800 Michigan Ave', 'Detroit', 'MI', '48210', {
    lat: 42.3314,
    lng: -83.1245,
    contact_name: 'Angela Ruiz',
    contact_phone: '(313) 555-0188',
    contact_email: 'dock@parkmfg.example',
  }),
  facility('fac-toledo', 'Toledo Distribution Center', '2150 Hill Ave', 'Toledo', 'OH', '43607', {
    lat: 41.6391,
    lng: -83.6026,
    contact_name: 'Ray Kowalski',
    contact_phone: '(419) 555-0132',
    timezone: 'America/New_York',
  }),
  facility(
    'fac-indy',
    'Indianapolis Cross-Dock',
    '5601 W Raymond St',
    'Indianapolis',
    'IN',
    '46241',
    {
      lat: 39.7337,
      lng: -86.2476,
      contact_name: 'Tasha Greene',
      contact_phone: '(317) 555-0164',
      timezone: 'America/Indiana/Indianapolis',
    },
  ),
];

type SlotSeed = [
  id: string,
  facilityId: string,
  name: string,
  type: string,
  minutes: number,
  equipment: string[] | null,
];

const SLOT_SEEDS: SlotSeed[] = [
  ['slot-det-1', 'fac-detroit', 'Door 01', 'inbound', 60, ['van', 'reefer']],
  ['slot-det-2', 'fac-detroit', 'Door 02', 'inbound', 60, ['van', 'reefer']],
  ['slot-det-3', 'fac-detroit', 'Door 03', 'outbound', 90, ['van']],
  ['slot-det-4', 'fac-detroit', 'Door 04 — Flatbed Yard', 'both', 120, ['flatbed', 'step_deck']],
  ['slot-tol-a', 'fac-toledo', 'Door A', 'both', 60, null],
  ['slot-tol-b', 'fac-toledo', 'Door B', 'both', 60, null],
  ['slot-ind-1', 'fac-indy', 'Bay 1', 'both', 60, ['van', 'box_truck']],
];

const DOCK_SLOTS: Row[] = SLOT_SEEDS.map(([id, facilityId, name, type, minutes, equipment]) => ({
  id,
  facility_id: facilityId,
  slot_name: name,
  slot_type: type,
  equipment_types: equipment,
  slot_duration_minutes: minutes,
  active: true,
  created_at: hoursAgo(24 * 300),
}));

interface ApptSeed {
  id: string;
  slotId: string;
  start: string;
  minutes: number;
  status: 'scheduled' | 'checked_in' | 'loading' | 'completed';
  type: 'inbound' | 'outbound';
  carrierCompanyId: string;
  driver: string;
  truck: string;
  loadId?: string;
  notes?: string;
}

// Built at seed time so "today's schedule" always lands on the current UTC day.
const apptSeeds = (): ApptSeed[] => [
  {
    id: 'appt-det-1',
    slotId: 'slot-det-1',
    start: todayUtcAt(12),
    minutes: 60,
    status: 'completed',
    type: 'inbound',
    carrierCompanyId: DEMO_IDS.carrierCompany,
    driver: 'Carlos Mendez',
    truck: 'RT-104',
    notes: 'Stamped steel inbound — 22 pallets',
  },
  {
    id: 'appt-det-2',
    slotId: 'slot-det-3',
    start: todayUtcAt(14),
    minutes: 90,
    status: 'loading',
    type: 'outbound',
    carrierCompanyId: DEMO_IDS.carrier2Company,
    driver: 'Andre Hill',
    truck: 'BR-218',
    notes: 'Outbound auto parts to Indianapolis',
  },
  {
    id: 'appt-det-3',
    slotId: 'slot-det-2',
    start: todayUtcAt(16),
    minutes: 60,
    status: 'checked_in',
    type: 'inbound',
    carrierCompanyId: DEMO_IDS.carrierCompany,
    driver: 'Mike Johnson',
    truck: 'RT-117',
  },
  {
    id: 'appt-det-4',
    slotId: 'slot-det-4',
    start: todayUtcAt(18),
    minutes: 120,
    status: 'scheduled',
    type: 'outbound',
    carrierCompanyId: DEMO_IDS.carrier3Company,
    driver: 'Tom Alvarez',
    truck: 'SH-031',
    notes: 'Steel coils — tarps required',
  },
  {
    id: 'appt-det-5',
    slotId: 'slot-det-1',
    start: todayUtcAt(20),
    minutes: 60,
    status: 'scheduled',
    type: 'inbound',
    carrierCompanyId: DEMO_IDS.carrier2Company,
    driver: 'Dana Brooks',
    truck: 'BR-205',
  },
  {
    id: 'appt-tol-1',
    slotId: 'slot-tol-a',
    start: todayUtcAt(15),
    minutes: 60,
    status: 'scheduled',
    type: 'inbound',
    carrierCompanyId: DEMO_IDS.carrierCompany,
    driver: 'Carlos Mendez',
    truck: 'RT-104',
  },
  {
    id: 'appt-tol-2',
    slotId: 'slot-tol-b',
    start: todayUtcAt(13, 0, 1),
    minutes: 60,
    status: 'scheduled',
    type: 'outbound',
    carrierCompanyId: DEMO_IDS.carrier3Company,
    driver: 'Tom Alvarez',
    truck: 'SH-044',
  },
];

function apptToRow(seed: ApptSeed): Row {
  const startMs = new Date(seed.start).getTime();
  const slot = DOCK_SLOTS.find((s) => s.id === seed.slotId);
  const arrived = seed.status !== 'scheduled';
  const done = seed.status === 'completed';
  const dwell = 48;
  return {
    id: seed.id,
    facility_id: slot?.facility_id ?? null,
    dock_slot_id: seed.slotId,
    load_id: seed.loadId ?? null,
    appointment_type: seed.type,
    scheduled_start: seed.start,
    scheduled_end: new Date(startMs + seed.minutes * MINUTE_MS).toISOString(),
    carrier_company_id: seed.carrierCompanyId,
    driver_name: seed.driver,
    truck_number: seed.truck,
    trailer_number: `${seed.truck}-T`,
    status: seed.status,
    checked_in_at: arrived ? new Date(startMs - 10 * MINUTE_MS).toISOString() : null,
    loading_started_at:
      seed.status === 'loading' || done ? new Date(startMs + 5 * MINUTE_MS).toISOString() : null,
    checked_out_at: done ? new Date(startMs + (dwell - 10) * MINUTE_MS).toISOString() : null,
    dwell_minutes: done ? dwell : null,
    notes: seed.notes ?? null,
    created_by: DEMO_IDS.shipper,
    created_at: hoursAgo(72),
  };
}

// ── Postgres functions ───────────────────────────────

function overlaps(startMs: number, endMs: number, appt: Row): boolean {
  const aStart = new Date(str(appt.scheduled_start)).getTime();
  const aEnd = new Date(str(appt.scheduled_end)).getTime();
  return startMs < aEnd && aStart < endMs;
}

function activeAppointments(rows: readonly Row[], slotId: unknown): Row[] {
  return rows.filter(
    (a) => a.dock_slot_id === slotId && a.status !== 'cancelled' && a.status !== 'no_show',
  );
}

const getAvailableDockSlots: DemoHandler = (args, { db }) => {
  const date = str(args.p_date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const dayStart = new Date(`${date}T00:00:00`).getTime();
  const now = Date.now();
  const appointments = db.read('dock_appointments');
  const slots = db
    .read('dock_slots')
    .filter((s) => s.facility_id === args.p_facility_id && s.active !== false);

  return slots
    .flatMap((slot) => {
      const minutes = Number(slot.slot_duration_minutes) || 60;
      const booked = activeAppointments(appointments, slot.id);
      const windows: Row[] = [];
      for (let m = OPEN_MINUTE; m + minutes <= CLOSE_MINUTE; m += minutes) {
        const startMs = dayStart + m * MINUTE_MS;
        const endMs = startMs + minutes * MINUTE_MS;
        if (startMs < now || booked.some((a) => overlaps(startMs, endMs, a))) continue;
        windows.push({
          dock_slot_id: slot.id,
          dock_name: slot.slot_name,
          start_time: new Date(startMs).toISOString(),
          end_time: new Date(endMs).toISOString(),
          slot_type: slot.slot_type,
        });
      }
      return windows;
    })
    .sort((a, b) => str(a.start_time).localeCompare(str(b.start_time)));
};

const bookDockAppointment: DemoHandler = (args, ctx) => {
  const identity = requireIdentity(ctx, 'book dock appointments');
  const slot = findById(ctx.db.read('dock_slots'), args.p_dock_slot_id);
  if (!slot) throw new Error('Dock door not found.');
  const startMs = new Date(str(args.p_scheduled_start)).getTime();
  const endMs = new Date(str(args.p_scheduled_end)).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error('Invalid appointment window.');
  }
  const booked = activeAppointments(ctx.db.read('dock_appointments'), slot.id);
  if (booked.some((a) => overlaps(startMs, endMs, a))) {
    throw new Error('That window was just booked — pick another slot.');
  }
  const [created] = ctx.db.insert('dock_appointments', [
    {
      facility_id: slot.facility_id,
      dock_slot_id: slot.id,
      load_id: optionalStr(args.p_load_id),
      appointment_type: optionalStr(args.p_appointment_type) ?? 'inbound',
      scheduled_start: new Date(startMs).toISOString(),
      scheduled_end: new Date(endMs).toISOString(),
      carrier_company_id: null,
      driver_name: null,
      truck_number: null,
      trailer_number: null,
      status: 'scheduled',
      checked_in_at: null,
      loading_started_at: null,
      checked_out_at: null,
      dwell_minutes: null,
      notes: optionalStr(args.p_notes),
      created_by: identity.id,
    },
  ]);
  return created ?? null;
};

const dockCheckIn: DemoHandler = (args, { db }) => {
  const appt = findById(db.read('dock_appointments'), args.p_appointment_id);
  if (!appt) throw new Error('Appointment not found.');
  if (appt.status !== 'scheduled') throw new Error('This appointment is already checked in.');
  db.update('dock_appointments', (a) => a.id === appt.id, {
    status: 'checked_in',
    checked_in_at: nowIso(),
  });
  return null;
};

const dockCheckOut: DemoHandler = (args, { db }) => {
  const appt = findById(db.read('dock_appointments'), args.p_appointment_id);
  if (!appt) throw new Error('Appointment not found.');
  if (appt.status !== 'checked_in' && appt.status !== 'loading') {
    throw new Error('Check the truck in before checking it out.');
  }
  const arrivedMs = new Date(str(appt.checked_in_at)).getTime();
  const dwell = Number.isFinite(arrivedMs)
    ? Math.max(1, Math.round((Date.now() - arrivedMs) / MINUTE_MS))
    : null;
  db.update('dock_appointments', (a) => a.id === appt.id, {
    status: 'completed',
    checked_out_at: nowIso(),
    dwell_minutes: dwell,
  });
  return null;
};

export function dockSeeds(): SeedTables {
  return {
    facilities: FACILITIES,
    dock_slots: DOCK_SLOTS,
    dock_appointments: apptSeeds().map(apptToRow),
  };
}

export const DOCK_RPC: Record<string, DemoHandler> = {
  get_available_dock_slots: getAvailableDockSlots,
  book_dock_appointment: bookDockAppointment,
  dock_check_in: dockCheckIn,
  dock_check_out: dockCheckOut,
};
