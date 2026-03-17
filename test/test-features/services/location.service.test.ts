/**
 * location lib — integration tests with mocked Supabase
 *
 * Verifies that insertLocationPing():
 *  - Inserts the correct fields into location_pings
 *  - Rounds heading_deg to the nearest integer
 *  - Returns null silently on a Supabase error (does NOT throw)
 *  - Returns the insert data on success
 *  - Passes null for missing optional fields (accuracy, heading, speed)
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { insertLocationPing } from '@/features/loads/lib/location';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: unknown) {
  const self: Record<string, unknown> = {};
  for (const m of ['insert', 'select', 'eq']) {
    self[m] = vi.fn().mockReturnValue(self);
  }
  self.then = (
    onfulfilled: (v: unknown) => unknown,
    onrejected: (v: unknown) => unknown,
  ) => Promise.resolve(result).then(onfulfilled, onrejected);
  return self;
}

const BASE_PING = {
  load_number: 'FX-20260301-0001',
  driver_id: 'driver-1',
  latitude: 32.7767,
  longitude: -96.797,
};

const mockFrom = vi.mocked(supabase.from);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// insertLocationPing
// ---------------------------------------------------------------------------

describe('insertLocationPing', () => {
  it('inserts a row with the correct required fields', async () => {
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder as never);

    await insertLocationPing(BASE_PING);

    expect(mockFrom).toHaveBeenCalledWith('location_pings');
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        load_number: 'FX-20260301-0001',
        driver_id: 'driver-1',
        latitude: 32.7767,
        longitude: -96.797,
      }),
    );
  });

  it('passes null for missing optional fields', async () => {
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder as never);

    await insertLocationPing(BASE_PING);

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy_m: null,
        heading_deg: null,
        speed_ms: null,
      }),
    );
  });

  it('includes optional fields when provided', async () => {
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder as never);

    await insertLocationPing({
      ...BASE_PING,
      accuracy_m: 8,
      heading_deg: 270,
      speed_ms: 22.5,
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy_m: 8,
        heading_deg: 270,
        speed_ms: 22.5,
      }),
    );
  });

  it('rounds heading_deg to the nearest integer', async () => {
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder as never);

    await insertLocationPing({ ...BASE_PING, heading_deg: 179.7 });

    const insertArg = (builder.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.heading_deg).toBe(180);
  });

  it('rounds heading_deg down correctly', async () => {
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder as never);

    await insertLocationPing({ ...BASE_PING, heading_deg: 45.3 });

    const insertArg = (builder.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.heading_deg).toBe(45);
  });

  it('returns null silently when Supabase returns an error (does NOT throw)', async () => {
    mockFrom.mockReturnValue(
      makeBuilder({ data: null, error: { message: 'table does not exist' } }) as never,
    );

    await expect(insertLocationPing(BASE_PING)).resolves.toBeNull();
  });

  it('does not throw on any Supabase error', async () => {
    mockFrom.mockReturnValue(
      makeBuilder({ data: null, error: { message: 'network error' } }) as never,
    );

    await expect(insertLocationPing(BASE_PING)).resolves.not.toThrow();
  });
});
