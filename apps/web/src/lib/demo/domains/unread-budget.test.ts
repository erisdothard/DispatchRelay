import { describe, expect, it } from 'vitest';
import { DEMO_IDENTITIES, type DemoRole } from '../identities';
import type { Row } from '../types';
import { buildSeedTables } from './index';

/**
 * A demo login should open to a quiet, believable inbox: at most one unread bell item,
 * one unread conversation and one "needs action" load per role, so each badge shows
 * once without the app looking like it is on fire.
 */
const ROLES: DemoRole[] = ['carrier', 'broker', 'shipper', 'driver'];
const tables = buildSeedTables();
const rows = (table: string): Row[] => [...(tables[table] ?? [])];

function unreadNotifications(userId: string): number {
  return rows('notifications').filter((n) => n.user_id === userId && n.read === false).length;
}

function unreadConversations(userId: string): number {
  const mine = new Set(
    rows('conversations')
      .filter((c) => c.participant_a === userId || c.participant_b === userId)
      .map((c) => c.id),
  );
  const withUnread = rows('messages')
    .filter((m) => mine.has(m.conversation_id) && m.sender_id !== userId && m.read === false)
    .map((m) => m.conversation_id);
  return new Set(withUnread).size;
}

/** Mirrors features/loads/hooks/use-load-action-counts.ts, which drives the nav loads badge. */
function loadActions(role: DemoRole, userId: string): number {
  const loads = rows('loads');
  if (role === 'broker') {
    return loads.filter((l) => l.posted_by === userId && l.status === 'bid_received').length;
  }
  if (role === 'carrier') {
    const won = new Set(
      rows('bids')
        .filter((b) => b.carrier_id === userId && b.status === 'accepted')
        .map((b) => b.load_id),
    );
    return loads.filter((l) => won.has(l.id) && l.status === 'awarded').length;
  }
  if (role === 'driver') {
    return loads.filter((l) => l.assigned_driver_id === userId && l.status === 'dispatched').length;
  }
  return 0;
}

describe('demo unread budget', () => {
  it.each(ROLES)('%s opens with at most one unread notification, and still shows one', (role) => {
    expect(unreadNotifications(DEMO_IDENTITIES[role].id)).toBe(1);
  });

  it.each(ROLES)('%s opens with at most one unread conversation', (role) => {
    expect(unreadConversations(DEMO_IDENTITIES[role].id)).toBeLessThanOrEqual(1);
  });

  it.each(ROLES)('%s opens with at most one load needing action', (role) => {
    expect(loadActions(role, DEMO_IDENTITIES[role].id)).toBeLessThanOrEqual(1);
  });
});
