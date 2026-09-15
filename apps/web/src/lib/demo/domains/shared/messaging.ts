/**
 * Inbox seeds for every persona. A conversation row is written from its creator's
 * (participant_a) point of view — messages.service re-derives the other party and the
 * unread count for whoever is reading, exactly as it does against the real database.
 */
import { DEMO_IDS } from '../../identities';
import { hoursAgo } from '../../time';
import type { DemoHandler, Row } from '../../types';

type MessageSeed = [senderId: string, text: string, hoursOld: number, read?: boolean];

interface ConversationSeed {
  id: string;
  creator: string;
  other: string;
  otherName: string;
  otherRole: string;
  loadNumber: string | null;
  messages: MessageSeed[];
}

const { carrier, carrier2, broker, shipper, driver, driver2, driver3 } = DEMO_IDS;

const CONVERSATIONS: ConversationSeed[] = [
  {
    id: 'conv-fx1042-broker',
    creator: broker,
    other: carrier,
    otherName: 'Rivera Transport Inc',
    otherRole: 'carrier',
    loadNumber: 'DR-1042',
    messages: [
      [broker, 'Morning Marcus — confirming Carlos picked up DR-1042 in Atlanta?', 20],
      [carrier, 'Yes ma’am, loaded and rolling at 6:40. 38k lbs, seal #448120.', 19.6],
      [broker, 'Perfect. Receiver in Dallas wants a call 1 hour out, dock 4.', 19.5],
      [carrier, 'Noted, I’ll pass it to Carlos.', 19.4],
      [
        broker,
        'Tracking shows him past Shreveport. Still good for the 7 AM window tomorrow?',
        1.2,
        false,
      ],
      [
        broker,
        'Also — lumper is pre-approved up to $150, just send the receipt with the POD.',
        0.5,
        false,
      ],
    ],
  },
  {
    id: 'conv-fx1042-driver',
    creator: carrier,
    other: driver,
    otherName: 'Carlos Mendez',
    otherRole: 'driver',
    loadNumber: 'DR-1042',
    messages: [
      [
        carrier,
        'Apex says receiver wants a call 1 hr out, dock 4. Lumper covered up to $150.',
        19.3,
      ],
      [driver, 'Copy that boss 👍', 19.2],
      [driver, 'Fueled up in Jackson, 62% on hours.', 9.5],
      [carrier, 'Good. Take your 10 in Longview if you need it — appointment isn’t till 7.', 9],
      [driver, 'Just passed the weigh station, all clear.', 1],
    ],
  },
  {
    id: 'conv-fx1051-driver',
    creator: carrier,
    other: driver2,
    otherName: 'Mike Johnson',
    otherRole: 'driver',
    loadNumber: 'DR-1051',
    messages: [
      [carrier, 'Mike, DR-1051 picks up 8 AM at San Antonio DC. 24 pallets of auto parts.', 30],
      [driver2, 'Got it. I’ll be there by 7:30.', 29],
      [driver2, 'Loaded. BOL uploaded to the app.', 8],
      [carrier, 'Thanks. Park Manufacturing wants updates every 4 hrs on this one.', 7.5],
      [driver2, 'No problem. Traffic in Houston but moving.', 3],
    ],
  },
  {
    id: 'conv-fx1050-broker',
    creator: carrier,
    other: broker,
    otherName: 'Apex Freight Solutions',
    otherRole: 'broker',
    loadNumber: 'DR-1050',
    messages: [
      [carrier, 'Hi Sarah, saw your counter at $920 on the Jacksonville → Savannah flatbed.', 2.5],
      [broker, 'Hey Marcus! Shipper is firm around there — 140 miles, straight shot.', 2.2],
      [carrier, 'Can you do $935 if we tarp? Driver has tarps on board.', 2],
    ],
  },
  {
    id: 'conv-fx1045-shipper',
    creator: shipper,
    other: carrier,
    otherName: 'Rivera Transport Inc',
    otherRole: 'carrier',
    loadNumber: 'DR-1045',
    messages: [
      [shipper, 'Marcus, dock appointment confirmed for 8 AM at the Charlotte DC.', 30],
      [carrier, 'Thanks James. Luis will check in at the guard shack.', 29.5],
      [carrier, 'Delivered clean, no OS&D. POD is uploaded.', 6],
      [shipper, 'Got it — receiving signed off. Appreciate the on-time delivery!', 5.5],
    ],
  },
  {
    id: 'conv-fx1045-driver',
    creator: carrier,
    other: driver3,
    otherName: 'Luis Ortega',
    otherRole: 'driver',
    loadNumber: 'DR-1045',
    messages: [
      [carrier, 'Luis, Charlotte DC has you at 8 AM, dock 12. Check in at the guard shack.', 30],
      [driver3, 'Copy. Parked at the Petro in Rock Hill, rolling at 7.', 12],
      [driver3, 'Unloaded, receiver signed clean. Uploading the POD now.', 6.2],
      [carrier, 'Got it — POD came through. Nice run. Take your 10, next dispatch tomorrow.', 5.8],
      [driver3, '👍 Thanks boss.', 5.7],
    ],
  },
  {
    id: 'conv-fx1051-shipper',
    creator: shipper,
    other: carrier,
    otherName: 'Rivera Transport Inc',
    otherRole: 'carrier',
    loadNumber: 'DR-1051',
    messages: [
      [shipper, 'Any update on DR-1051? New Orleans is asking.', 3.5],
      [
        carrier,
        'Mike cleared Houston, just east of Beaumont now. On schedule for tomorrow AM.',
        0.4,
        false,
      ],
    ],
  },
  {
    id: 'conv-shipper-broker-capacity',
    creator: shipper,
    other: broker,
    otherName: 'Sarah Chen',
    otherRole: 'broker',
    loadNumber: null,
    messages: [
      [
        shipper,
        'Sarah — we have 6 truckloads Detroit → Indianapolis next week. Can you cover?',
        26,
      ],
      [broker, 'Absolutely. Dry van, same specs as last month?', 25],
      [shipper, 'Same specs, 40k lbs max, 48-hour lead on pickup.', 24],
      [
        broker,
        'I’ll have rates to you by end of day. Blue Ridge and Rivera both run that lane.',
        4,
      ],
    ],
  },
  {
    id: 'conv-fx1046-bid',
    creator: carrier2,
    other: broker,
    otherName: 'Sarah Chen',
    otherRole: 'broker',
    loadNumber: 'DR-1046',
    messages: [
      [
        carrier2,
        'Hi Sarah, Dana at Blue Ridge. We bid $1,975 on Houston → Memphis with team drivers.',
        9,
      ],
      [
        carrier2,
        'Team can deliver same day — worth the premium if the receiver is tight on time.',
        8.8,
        false,
      ],
    ],
  },
  {
    id: 'conv-fx1042-checkcall',
    creator: broker,
    other: driver,
    otherName: 'Carlos Mendez',
    otherRole: 'driver',
    loadNumber: 'DR-1042',
    messages: [
      [
        broker,
        'Hi Carlos, Sarah from Apex. Can you send a quick check call when you stop tonight?',
        6,
      ],
      [driver, 'Will do. Longview area around 9 PM.', 5.5],
      [broker, 'Thank you! Safe travels.', 5.4],
    ],
  },
  {
    id: 'conv-drivers',
    creator: driver2,
    other: driver,
    otherName: 'Carlos Mendez',
    otherRole: 'driver',
    loadNumber: null,
    messages: [
      [driver2, 'You running I-20 tonight? Heard there’s construction near Shreveport.', 5],
      [driver, 'Already through it, 20 min delay. Left lane closed at mile 17.', 4.5],
      [driver2, 'Appreciate it 🙏', 4.4, false],
    ],
  },
];

export function buildMessagingSeeds(): { conversations: Row[]; messages: Row[] } {
  const conversations: Row[] = [];
  const messages: Row[] = [];
  for (const convo of CONVERSATIONS) {
    const last = convo.messages[convo.messages.length - 1];
    conversations.push({
      id: convo.id,
      participant_a: convo.creator,
      participant_b: convo.other,
      other_party: convo.otherName,
      other_party_role: convo.otherRole,
      load_number: convo.loadNumber,
      last_message: last?.[1] ?? null,
      last_message_at: hoursAgo(last?.[2] ?? 48),
      unread_count: 0,
      created_at: hoursAgo(convo.messages[0]?.[2] ?? 48),
    });
    convo.messages.forEach(([senderId, text, hours, read = true], i) => {
      messages.push({
        id: `${convo.id}-msg-${i + 1}`,
        conversation_id: convo.id,
        sender_id: senderId,
        text,
        from_me: senderId === convo.creator,
        read,
        created_at: hoursAgo(hours),
      });
    });
  }
  return { conversations, messages };
}

// ── Simulated replies ─────────────────────────────────────

const REPLY_DELAY_MS = 2500;

const REPLIES: Record<string, string[]> = {
  broker: [
    'Got it, thanks! I’ll update the shipper.',
    'Sounds good — I’ll send the rate con over shortly.',
    'Perfect. Let me know if anything changes on your end.',
  ],
  carrier: [
    'Copy that. I’ll check with dispatch and get right back to you.',
    'Works for us. We’ll keep tracking live in the app.',
    'Thanks! Driver has been notified.',
  ],
  shipper: [
    'Thanks for the update — receiving has been notified.',
    'Great, appreciate the heads up.',
    'Understood. Please upload the POD once delivered.',
  ],
  driver: ['10-4 👍', 'On it, will update when I’m unloaded.', 'Copy. About 2 hours out.'],
};

function readRow(rows: readonly Row[], id: unknown): Row | undefined {
  return rows.find((r) => r.id === id);
}

/**
 * The other participant answers a few seconds after a demo user sends a message, so the
 * inbox, unread badges and notification bell all visibly update live.
 */
export const simulateReply: DemoHandler = (args, { identity, db }) => {
  if (!identity) return null;
  const convo = readRow(db.read('conversations'), args.p_conversation_id);
  if (!convo) return null;
  const otherId = convo.participant_a === identity.id ? convo.participant_b : convo.participant_a;
  const other = readRow(db.read('profiles'), otherId);
  if (!other) return null;

  const pool = REPLIES[String(other.role)] ?? REPLIES.carrier;
  const sentSoFar = db.read('messages').filter((m) => m.conversation_id === convo.id).length;
  const text = pool[sentSoFar % pool.length];

  setTimeout(() => {
    const now = new Date().toISOString();
    db.insert('messages', [
      { conversation_id: convo.id, sender_id: otherId, text, from_me: false, read: false },
    ]);
    db.update('conversations', (c) => c.id === convo.id, {
      last_message: text,
      last_message_at: now,
    });
    // One outstanding bell item per sender: a chatty thread refreshes it instead of stacking.
    const title = `Message from ${String(other.full_name ?? 'DispatchRelay user')}`;
    const pending = (n: Row) =>
      n.user_id === identity.id && n.type === 'new_message' && n.title === title && !n.read;
    if (db.read('notifications').some(pending)) {
      db.update('notifications', pending, { body: text, created_at: now });
    } else {
      db.insert('notifications', [
        { user_id: identity.id, type: 'new_message', title, body: text, load_id: null },
      ]);
    }
  }, REPLY_DELAY_MS);
  return null;
};
