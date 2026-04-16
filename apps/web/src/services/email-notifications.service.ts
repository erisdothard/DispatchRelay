import { supabase } from '@/lib/supabase';

interface EmailTrigger {
  template: string;
  to: string;
  subject: string;
  data: Record<string, unknown>;
}

/**
 * Enqueue an email notification via the notification_queue table.
 * The notification-worker edge function will dispatch it asynchronously.
 * Falls back to direct edge function call if queue RPC fails.
 */
async function enqueue(trigger: EmailTrigger): Promise<void> {
  const { error } = await supabase.rpc('enqueue_notification', {
    p_type: 'email',
    p_recipient: trigger.to,
    p_subject: trigger.subject,
    p_payload: { template: trigger.template, data: trigger.data } as any,
  });

  // Non-fatal — email failure should never block the main action
  if (error) {
    console.warn('[email-notifications] Enqueue failed (non-fatal):', error.message);
  }
}

// ── Public notification triggers ────────────────────────────────────────────

export async function notifyNewBid(params: {
  posterEmail: string;
  loadNumber: string;
  origin: string;
  dest: string;
  amount: number;
  carrierName: string;
}): Promise<void> {
  await enqueue({
    template: 'new_bid',
    to: params.posterEmail,
    subject: `New bid on load ${params.loadNumber}`,
    data: {
      load_number: params.loadNumber,
      origin: params.origin,
      dest: params.dest,
      amount: params.amount,
      carrier_name: params.carrierName,
    },
  });
}

export async function notifyBidAccepted(params: {
  carrierEmail: string;
  loadNumber: string;
  origin: string;
  dest: string;
  pickupDate: string;
}): Promise<void> {
  await enqueue({
    template: 'bid_accepted',
    to: params.carrierEmail,
    subject: `Your bid on ${params.loadNumber} was accepted!`,
    data: {
      load_number: params.loadNumber,
      origin: params.origin,
      dest: params.dest,
      pickup_date: params.pickupDate,
    },
  });
}

export async function notifyBidDeclined(params: {
  carrierEmail: string;
  loadNumber: string;
}): Promise<void> {
  await enqueue({
    template: 'bid_declined',
    to: params.carrierEmail,
    subject: `Bid update for load ${params.loadNumber}`,
    data: { load_number: params.loadNumber },
  });
}

export async function notifyBookingConfirmed(params: {
  email: string;
  loadNumber: string;
  origin: string;
  dest: string;
  pickupDate: string;
  amount: number;
}): Promise<void> {
  await enqueue({
    template: 'booking_confirmed',
    to: params.email,
    subject: `Booking confirmed: ${params.loadNumber}`,
    data: {
      load_number: params.loadNumber,
      origin: params.origin,
      dest: params.dest,
      pickup_date: params.pickupDate,
      amount: params.amount,
    },
  });
}

export async function notifyLoadStatusChange(params: {
  email: string;
  loadNumber: string;
  origin: string;
  dest: string;
  status: string;
}): Promise<void> {
  await enqueue({
    template: 'load_status_change',
    to: params.email,
    subject: `Load ${params.loadNumber} status: ${params.status.replace(/_/g, ' ')}`,
    data: {
      load_number: params.loadNumber,
      origin: params.origin,
      dest: params.dest,
      status: params.status,
    },
  });
}

export async function notifyNewMessage(params: {
  recipientEmail: string;
  senderName: string;
  preview: string;
}): Promise<void> {
  await enqueue({
    template: 'new_message',
    to: params.recipientEmail,
    subject: `New message from ${params.senderName}`,
    data: {
      sender_name: params.senderName,
      preview: params.preview.slice(0, 200),
    },
  });
}

export async function notifyBolSigned(params: {
  email: string;
  loadNumber: string;
  origin: string;
  dest: string;
  signedBy: string;
  bolPdfUrl?: string;
}): Promise<void> {
  await enqueue({
    template: 'bol_signed',
    to: params.email,
    subject: `BOL signed for load ${params.loadNumber}`,
    data: {
      load_number: params.loadNumber,
      origin: params.origin,
      dest: params.dest,
      signed_by: params.signedBy,
      ...(params.bolPdfUrl && { bol_pdf_url: params.bolPdfUrl }),
    },
  });
}

// ── SMS helpers ──────────────────────────────────────────────────────────────

export async function enqueueSms(params: {
  to: string; // E.164
  message: string;
}): Promise<void> {
  const { error } = await supabase.rpc('enqueue_notification', {
    p_type: 'sms',
    p_recipient: params.to,
    p_subject: null as any,
    p_payload: { message: params.message },
  });
  if (error) {
    console.warn('[sms-notifications] Enqueue failed (non-fatal):', error.message);
  }
}

export async function smsBookingConfirmed(params: {
  to: string;
  loadNumber: string;
  origin: string;
  dest: string;
}): Promise<void> {
  await enqueueSms({
    to: params.to,
    message: `FreightX: Booking confirmed — Load ${params.loadNumber}, ${params.origin} → ${params.dest}. View: freightx.app`,
  });
}

export async function smsPickupReminder(params: {
  to: string;
  loadNumber: string;
  pickupCity: string;
}): Promise<void> {
  await enqueueSms({
    to: params.to,
    message: `FreightX reminder: Pickup tomorrow for load ${params.loadNumber} in ${params.pickupCity}. freightx.app`,
  });
}
