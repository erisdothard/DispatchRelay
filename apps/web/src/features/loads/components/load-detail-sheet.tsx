import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Scale,
  Calendar,
  Zap,
  Shield,
  Clock,
  MapPin,
  Package,
  Thermometer,
  AlertTriangle,
  TrendingUp,
  Users,
  FileUp,
  Pencil,
  UserCheck,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import { BottomSheet } from '@/shared/components/bottom-sheet';
import {
  analyzeRate,
  getLoadAge,
  getBrokerCreditLabel,
  calcGrossProfit,
} from '@/shared/lib/freight';
import { LoadStatusStepper } from './load-status-stepper';
import { BidSheet } from '@/features/bids/components/bid-sheet';
import { BidListSheet } from '@/features/bids/components/bid-list-sheet';
import { DocumentUpload } from '@/features/documents/components/document-upload';
import { SignedBolViewer } from '@/features/documents/components/signed-bol-viewer';
import { BrokerCreditBadge } from './broker-credit-badge';
import { EditLoadSheet } from './edit-load-sheet';
import { AssignDriverSheet } from './assign-driver-sheet';
import { getDocumentsForLoad, getBolStatusForLoads } from '@/services/documents.service';
import { getOrCreateConversation } from '@/services/messages.service';
import { RateConSignatureSheet } from '@/features/documents/components/rate-con-signature-sheet';
import type { DocumentRow } from '@/lib/database.types';
import { AccessorialsSheet } from './accessorials-sheet';
import { bookNow } from '@/services/bids.service';
import { updateLoad, nudgeCarrier, confirmReceipt } from '@/services/loads.service';
import { generateRateCon } from '@/features/bookings/lib/generate-rate-con';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Load } from '@freightx/shared';
import type { LoadStatus, UserRole } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { haversineDistance } from '@/shared/lib/utils';
import { supabase } from '@/lib/supabase';

interface LoadDetailSheetProps {
  load: Load | null;
  onClose: () => void;
  onBid?: (load: Load) => void; // kept for back-compat; now handled internally
  showBidButton?: boolean;
  role?: UserRole;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="w-8 h-8 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
        <span className="text-fx-text-muted">{icon}</span>
      </div>
      <span className="text-sm text-fx-text-muted flex-1">{label}</span>
      <span className="text-sm font-semibold text-fx-text">{value}</span>
    </div>
  );
}

function formatApptWindow(start?: string, end?: string): string {
  if (!start && !end) return '—';
  const fmt = (date: string) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  if (start) return `After ${fmt(start)}`;
  if (end) return `Before ${fmt(end)}`;
  return '—';
}

function formatDimensions(l?: number, w?: number, h?: number): string {
  if (!l && !w && !h) return '—';
  const parts = [];
  if (l) parts.push(`${l}"`);
  if (w) parts.push(`${w}"`);
  if (h) parts.push(`${h}"`);
  return parts.join(' × ');
}

const ACTIVE_STATUSES: LoadStatus[] = [
  'awarded',
  'dispatched',
  'in_transit',
  'delivered',
  'completed',
];

export function LoadDetailSheet({
  load,
  onClose,
  showBidButton = true,
  role,
}: LoadDetailSheetProps) {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  const [bidOpen, setBidOpen] = useState(false);
  const [bidListOpen, setBidListOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [signedBolDoc, setSignedBolDoc] = useState<DocumentRow | null>(null);
  const [loadingBol, setLoadingBol] = useState(false);
  const [hasSignedBol, setHasSignedBol] = useState(false);
  const [rateConSigned, setRateConSigned] = useState(false);
  const [rateConDownloadUrl, setRateConDownloadUrl] = useState<string | null>(null);
  const [bolDownloadUrl, setBolDownloadUrl] = useState<string | null>(null);
  const [rateConOpen, setRateConOpen] = useState(false);
  const [accessorialsOpen, setAccessorialsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<LoadStatus | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [assignDriverOpen, setAssignDriverOpen] = useState(false);
  const [driverAssigned, setDriverAssigned] = useState(!!load?.assignedDriverId);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  // Profit estimator
  const [profitExpanded, setProfitExpanded] = useState(false);
  const [costPerMile, setCostPerMile] = useState<string>(
    () => localStorage.getItem('fx_carrier_cpp') ?? '1.80',
  );
  const [mpg, setMpg] = useState<string>(() => localStorage.getItem('fx_mpg') ?? '6.5');
  const [fuelPrice, setFuelPrice] = useState<string>(
    () => localStorage.getItem('fx_fuel_price') ?? '4.00',
  );
  const [factoringPct, setFactoringPct] = useState<string>(
    () => localStorage.getItem('fx_factoring_pct') ?? '0',
  );
  // Distance to pickup
  const [distanceMi, setDistanceMi] = useState<number | null>(null);
  // Broker factoring acceptance
  const [acceptsFactoring, setAcceptsFactoring] = useState<boolean | null>(null);
  // Message broker
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!load?.id) return;
    const loadId = load.id;

    async function checkDocStatus() {
      try {
        const [bolStatus] = await getBolStatusForLoads([loadId]);
        setHasSignedBol(bolStatus?.signed ?? false);

        // Check if rate con is signed (for awarded loads)
        const docs = await getDocumentsForLoad(loadId);
        const signedRateCon = docs.find((d) => d.type === 'rate_confirmation' && !!d.signed_at);
        setRateConSigned(!!signedRateCon);
        setRateConDownloadUrl(signedRateCon?.file_url ?? null);

        const signedBol = docs.find((d) => d.type === 'bill_of_lading' && !!d.signed_at);
        setBolDownloadUrl(signedBol?.file_url ?? null);
      } catch {
        setHasSignedBol(false);
      }
    }

    checkDocStatus();
    setNudgeSent(false);
    setReceiptConfirmed(false);
  }, [load?.id]);

  // Geolocation: distance to pickup (carrier/driver only, silent on denial)
  useEffect(() => {
    if (!load?.id) return;
    const originLat = (load as unknown as { originLat?: number }).originLat;
    const originLng = (load as unknown as { originLng?: number }).originLng;
    if (!originLat || !originLng) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          originLat,
          originLng,
        );
        setDistanceMi(Math.round(dist));
      },
      () => setDistanceMi(null),
      { timeout: 5000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load?.id]);

  // Fetch broker factoring acceptance
  useEffect(() => {
    if (!load?.companyId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('companies')
      .select('accepts_factoring')
      .eq('id', load.companyId)
      .maybeSingle()
      .then(({ data }: { data: { accepts_factoring: boolean } | null }) => {
        setAcceptsFactoring(data?.accepts_factoring ?? false);
      });
  }, [load?.companyId]);

  async function handleViewSignedBol() {
    if (!load) return;
    setLoadingBol(true);
    try {
      const docs = await getDocumentsForLoad(load.id);
      const signed = docs.find((d) => d.type === 'bill_of_lading' && d.signed_at);
      if (signed) setSignedBolDoc(signed);
    } catch {
      // silently ignore
    } finally {
      setLoadingBol(false);
    }
  }

  async function handleNudgeCarrier() {
    if (!load?.assigneeId) return;
    try {
      await nudgeCarrier(load.id, load.assigneeId, load.loadNumber);
      setNudgeSent(true);
    } catch {
      // silently ignore — notification failure shouldn't block the UI
    }
  }

  async function handleConfirmReceipt() {
    if (!load?.postedBy) return;
    setConfirmingReceipt(true);
    try {
      await confirmReceipt(load.id, load.postedBy, load.loadNumber);
      setReceiptConfirmed(true);
    } catch {
      // silently ignore
    } finally {
      setConfirmingReceipt(false);
    }
  }

  async function handleCancel() {
    if (!load) return;
    setCancelling(true);
    try {
      await updateLoad(load.id, { status: 'cancelled' });
      setCurrentStatus('cancelled');
      setCancelConfirm(false);
      setTimeout(onClose, 800);
    } catch {
      // status update failed silently — stepper will show current state
    } finally {
      setCancelling(false);
    }
  }

  async function handleBookNow() {
    if (!load) return;
    setBooking(true);
    setBookError(null);
    try {
      await bookNow(load.id);
      setCurrentStatus('awarded');
    } catch (e) {
      setBookError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  async function handleMessageBroker() {
    if (!load || !user) return;
    setMessaging(true);
    try {
      const convo = await getOrCreateConversation(
        user.id,
        load.postedBy || user.id,
        load.companyName,
        'broker',
      );
      navigate('/messages', { state: { openConversation: convo } });
    } catch {
      // fall through — navigate to messages and user can start manually
      navigate('/messages');
    } finally {
      setMessaging(false);
    }
  }

  function saveCostPerMile(val: string) {
    setCostPerMile(val);
    localStorage.setItem('fx_carrier_cpp', val);
  }
  function saveMpg(val: string) {
    setMpg(val);
    localStorage.setItem('fx_mpg', val);
  }
  function saveFuelPrice(val: string) {
    setFuelPrice(val);
    localStorage.setItem('fx_fuel_price', val);
  }
  function saveFactoringPct(val: string) {
    setFactoringPct(val);
    localStorage.setItem('fx_factoring_pct', val);
  }

  if (!load) return null;

  const liveStatus = (currentStatus ?? load.status) as LoadStatus;
  const rate = analyzeRate(load);
  const age = getLoadAge(load.postedAt);
  const credit = getBrokerCreditLabel(load.brokerCreditScore);
  const profit = calcGrossProfit(load);

  const pickupFmt = new Date(load.pickupDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const deliveryFmt = load.deliveryDate
    ? new Date(load.deliveryDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const showStepper = ACTIVE_STATUSES.includes(liveStatus);
  const showDocs = ACTIVE_STATUSES.includes(liveStatus) && !!role;
  const isBroker = role === 'broker' || role === 'admin';
  const isCarrier = role === 'carrier';
  const isShipper = role === 'shipper';
  const canEdit =
    user &&
    load &&
    (load.postedBy === user.id || user.role === 'admin') &&
    (liveStatus === 'posted' || liveStatus === 'bid_received');

  return (
    <>
      <BottomSheet open={!!load} onClose={onClose} title="Load Details">
        {/* Route hero */}
        <div
          className="rounded-2xl p-4 mb-5 flex flex-col gap-2"
          style={{
            background:
              'linear-gradient(135deg, rgba(240,112,64,0.12) 0%, rgba(192,58,18,0.08) 100%)',
            border: '1px solid rgba(240,112,64,0.2)',
          }}
        >
          {(() => {
            const showFullAddress = ACTIVE_STATUSES.includes(liveStatus) || role === 'driver';
            return (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-fx-text-muted uppercase tracking-widest mb-0.5">
                      Origin
                    </p>
                    <p className="text-[17px] font-extrabold text-white tracking-tight">
                      {load.originCity}, {load.originState}
                    </p>
                    {(isCarrier || role === 'driver') && distanceMi !== null && (
                      <p className="text-[11px] text-fx-text-dim mt-0.5">{distanceMi} mi away</p>
                    )}
                    {showFullAddress && load.originAddress && (
                      <p className="text-[12px] text-fx-text-muted mt-0.5">
                        {load.originAddress}
                        {load.originZip ? ` ${load.originZip}` : ''}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={20} className="text-fx-orange shrink-0" strokeWidth={2.5} />
                  <div className="flex-1 text-right">
                    <p className="text-[11px] font-bold text-fx-text-muted uppercase tracking-widest mb-0.5">
                      Destination
                    </p>
                    <p className="text-[17px] font-extrabold text-white tracking-tight">
                      {load.destCity}, {load.destState}
                    </p>
                    {showFullAddress && load.destAddress && (
                      <p className="text-[12px] text-fx-text-muted mt-0.5">
                        {load.destAddress}
                        {load.destZip ? ` ${load.destZip}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
          {load.totalMiles && (
            <div className="flex items-center justify-center">
              <span className="text-[11px] font-semibold text-fx-text-dim bg-fx-surface/60 px-3 py-1 rounded-full">
                {load.totalMiles} miles
              </span>
            </div>
          )}
        </div>

        {/* Rate card */}
        <div
          className="rounded-2xl p-4 mb-5 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span
                className="text-[36px] font-extrabold leading-none tracking-[-0.03em]"
                style={{ color: rate.health === 'low' ? '#F87171' : '#FFFFFF' }}
              >
                ${load.rateUsd.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {load.ratePerMile > 0 && (
                <span className="text-sm font-semibold text-fx-text-muted">
                  ${load.ratePerMile.toFixed(2)}/mi
                </span>
              )}
              <span className="text-xs font-bold" style={{ color: rate.color }}>
                {rate.delta}
              </span>
            </div>
            {profit && (
              <div className="flex items-center gap-1 mt-1.5">
                <TrendingUp size={11} className="text-fx-text-dim" />
                <span className="text-[11px] text-fx-text-dim font-medium">{profit}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
              style={{
                background: `${rate.color}1A`,
                border: `1px solid ${rate.color}40`,
                color: rate.color,
              }}
            >
              {rate.health === 'hot' && <Zap size={10} fill="currentColor" />}
              {rate.label}
            </div>
            {credit && (
              <div className="flex items-center gap-1">
                <Shield size={11} style={{ color: credit.color }} fill="currentColor" />
                <span className="text-[11px] font-bold" style={{ color: credit.color }}>
                  {credit.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status stepper */}
        {showStepper && role && (
          <div className="mb-5">
            <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
              Load Progress
            </p>
            <LoadStatusStepper
              loadId={load.id}
              currentStatus={liveStatus}
              role={role}
              hasDriverAssigned={driverAssigned || !!load.assignedDriverId}
              rateConSigned={rateConSigned}
              onStatusAdvanced={(s) => setCurrentStatus(s)}
              onDispatched={() => setDocsOpen(true)}
              onRateConRequired={() => setRateConOpen(true)}
              loadNumber={load.loadNumber}
              origin={`${load.originCity}, ${load.originState}`}
              dest={`${load.destCity}, ${load.destState}`}
            />
          </div>
        )}

        {/* Broker: waiting for carrier to dispatch */}
        {isBroker && liveStatus === 'awarded' && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
              Waiting on Carrier
            </p>
            <p className="text-[12px] text-fx-text-muted mb-3">
              <span className="font-semibold text-fx-text">
                {load.assigneeName ?? 'The carrier'}
              </span>{' '}
              needs to sign the rate confirmation and dispatch. Send a reminder if they haven't
              acted.
            </p>
            {load.assigneeId ? (
              <button
                onClick={handleNudgeCarrier}
                disabled={nudgeSent}
                className="w-full h-10 rounded-xl text-sm font-bold border border-amber-500/40 text-amber-400 disabled:opacity-50 transition-opacity"
              >
                {nudgeSent ? '✓ Reminder Sent' : 'Nudge Carrier'}
              </button>
            ) : (
              <p className="text-[11px] text-fx-text-dim">No carrier contact available.</p>
            )}
          </div>
        )}

        {/* Rate Con CTA - carrier must sign before dispatch */}
        {isCarrier && liveStatus === 'awarded' && !rateConSigned && (
          <div className="mb-5">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
              <p className="text-xs font-bold text-amber-400 mb-1">Rate Confirmation Required</p>
              <p className="text-[11px] text-fx-text-muted">
                Sign the rate confirmation to lock in your rate before dispatch.
              </p>
            </div>
            <button
              onClick={() => setRateConOpen(true)}
              className="w-full h-11 rounded-2xl bg-fx-orange text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              <FileText size={14} />
              Sign Rate Confirmation
            </button>
          </div>
        )}

        {/* Rate Con signed badge */}
        {isCarrier && liveStatus !== 'posted' && rateConSigned && (
          <div className="mb-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <FileText size={13} className="text-green-400" />
            <span className="text-[12px] font-semibold text-green-400">
              Rate Confirmation Signed
            </span>
          </div>
        )}

        {/* Assign Driver - only after rate con signed (awarded) or when dispatched/in_transit */}
        {isCarrier &&
          ['awarded', 'dispatched', 'in_transit'].includes(liveStatus) &&
          (liveStatus !== 'awarded' || rateConSigned) && (
            <div className="mb-5">
              <button
                onClick={() => setAssignDriverOpen(true)}
                className="w-full h-11 rounded-2xl border border-fx-orange/40 text-sm font-semibold text-fx-orange flex items-center justify-center gap-2 hover:bg-fx-orange/5 transition-colors"
              >
                <UserCheck size={14} />
                {driverAssigned || load.assignedDriverId ? 'Reassign Driver' : 'Assign Driver'}
              </button>
            </div>
          )}

        {/* Shipper: carrier assigned info */}
        {isShipper && ACTIVE_STATUSES.includes(liveStatus) && load.assigneeName && (
          <div className="mb-5 flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <UserCheck size={14} className="text-green-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-green-400 uppercase">Carrier Assigned</p>
              <p className="text-sm font-bold text-fx-text">{load.assigneeName}</p>
            </div>
          </div>
        )}

        {/* Shipper: status context for pre-award states */}
        {isShipper && liveStatus === 'posted' && (
          <div className="mb-5 p-3 rounded-xl bg-fx-surface-2 border border-fx-border">
            <p className="text-xs font-bold text-fx-text-muted mb-1">Awaiting Carrier</p>
            <p className="text-[11px] text-fx-text-dim">
              Your load is live on the board. Carriers are reviewing it.
            </p>
          </div>
        )}
        {isShipper && liveStatus === 'bid_received' && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs font-bold text-amber-400 mb-1">Bids Received</p>
            <p className="text-[11px] text-fx-text-dim">
              Carriers have submitted bids. Your broker is reviewing and will assign a carrier
              shortly.
            </p>
          </div>
        )}
        {isShipper && liveStatus === 'dispatched' && (
          <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs font-bold text-blue-400 mb-1">On the Way to Pickup</p>
            <p className="text-[11px] text-fx-text-dim">
              Your carrier is en route to the pickup location. You'll get an update when they're in
              transit.
            </p>
          </div>
        )}
        {isShipper && liveStatus === 'in_transit' && (
          <div className="mb-5 p-3 rounded-xl bg-fx-orange/10 border border-fx-orange/20">
            <p className="text-xs font-bold text-fx-orange mb-1">Shipment In Transit</p>
            <p className="text-[11px] text-fx-text-dim">
              Your load is on the road. Tap "Track Shipment" below for live updates.
            </p>
          </div>
        )}
        {isShipper && liveStatus === 'delivered' && !receiptConfirmed && (
          <div className="mb-5 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-xs font-bold text-green-400 mb-1">Delivered — Action Required</p>
            <p className="text-[11px] text-fx-text-dim">
              Your shipment has been delivered. Please confirm receipt so the broker can close this
              load.
            </p>
          </div>
        )}
        {isShipper &&
          (liveStatus === 'completed' || (liveStatus === 'delivered' && receiptConfirmed)) && (
            <div className="mb-5 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs font-bold text-green-400 mb-1">✓ Delivery Confirmed</p>
              <p className="text-[11px] text-fx-text-dim">
                {liveStatus === 'completed'
                  ? 'This load has been fully closed out.'
                  : 'Your broker has been notified and will close this load shortly.'}
              </p>
            </div>
          )}

        {/* Detail rows */}
        <div className="mb-5">
          <InfoRow icon={<Calendar size={14} />} label="Pickup" value={pickupFmt} />
          <InfoRow icon={<Calendar size={14} />} label="Delivery" value={deliveryFmt} />
          <div
            className="flex items-center gap-3 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
              <span className="text-fx-text-muted">
                <Package size={14} />
              </span>
            </div>
            <span className="text-sm text-fx-text-muted flex-1">Equipment</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-fx-text">
                {EQUIPMENT_LABELS[load.equipment] ?? load.equipment}
              </span>
              {load.fullPartial && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-fx-surface border border-fx-border text-fx-text-dim">
                  {load.fullPartial === 'full' ? 'Full Truckload' : 'Partial'}
                </span>
              )}
            </div>
          </div>
          {load.commodity && (
            <InfoRow icon={<Package size={14} />} label="Commodity" value={load.commodity} />
          )}
          <InfoRow
            icon={<Scale size={14} />}
            label="Weight"
            value={`${(load.weightLbs / 1000).toFixed(0)}k lbs`}
          />
          <div
            className="flex items-center gap-3 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
              <span className="text-fx-text-muted">
                <MapPin size={14} />
              </span>
            </div>
            <span className="text-sm text-fx-text-muted flex-1">Broker</span>
            <div className="flex items-center gap-2">
              {load.companyLogoUrl ? (
                <img
                  src={load.companyLogoUrl}
                  alt={load.companyName}
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <div className="h-5 w-5 rounded bg-brand/10 flex items-center justify-center text-[9px] font-medium text-brand">
                  {load.companyName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-fx-text">{load.companyName}</span>
            </div>
          </div>
          {age && <InfoRow icon={<Clock size={14} />} label="Posted" value={age} />}
          {load.loadNumber && (
            <InfoRow icon={<Package size={14} />} label="Load #" value={load.loadNumber} />
          )}

          {/* Additional freight details — always visible */}
          <>
            {load.freight_class && (
              <InfoRow
                icon={<Package size={14} />}
                label="Freight Class"
                value={load.freight_class}
              />
            )}
            {load.packaging_type && (
              <InfoRow icon={<Package size={14} />} label="Packaging" value={load.packaging_type} />
            )}
            {load.piecesCount && (
              <InfoRow
                icon={<Package size={14} />}
                label="Pieces"
                value={String(load.piecesCount)}
              />
            )}
            {load.palletsCount && (
              <InfoRow
                icon={<Package size={14} />}
                label="Pallets"
                value={String(load.palletsCount)}
              />
            )}
            {(load.lengthIn || load.widthIn || load.heightIn) && (
              <InfoRow
                icon={<Package size={14} />}
                label="Dimensions"
                value={formatDimensions(load.lengthIn, load.widthIn, load.heightIn)}
              />
            )}
            {typeof load.stackable === 'boolean' && (
              <InfoRow
                icon={<Package size={14} />}
                label="Stackable"
                value={load.stackable ? 'Yes' : 'No'}
              />
            )}
          </>
        </div>

        {/* Profit Estimator - carrier only, any load with a rate */}
        {(isCarrier || role === 'driver') && load.rateUsd > 0 && (
          <div className="mb-5">
            <button
              onClick={() => setProfitExpanded((e) => !e)}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <DollarSign size={13} className="text-fx-orange" />
                <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
                  Profit Estimator
                </p>
              </div>
              {profitExpanded ? (
                <ChevronUp size={14} className="text-fx-text-dim" />
              ) : (
                <ChevronDown size={14} className="text-fx-text-dim" />
              )}
            </button>
            {profitExpanded && (
              <div className="space-y-3 mt-2">
                {/* Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-fx-text-dim block mb-1">
                      Op Cost ($/mi)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPerMile}
                      onChange={(e) => saveCostPerMile(e.target.value)}
                      className="w-full h-8 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-sm px-2 focus:border-fx-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-fx-text-dim block mb-1">MPG</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={mpg}
                      onChange={(e) => saveMpg(e.target.value)}
                      className="w-full h-8 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-sm px-2 focus:border-fx-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-fx-text-dim block mb-1">
                      Fuel Price ($/gal)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fuelPrice}
                      onChange={(e) => saveFuelPrice(e.target.value)}
                      className="w-full h-8 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-sm px-2 focus:border-fx-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-fx-text-dim block mb-1">Factoring (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={factoringPct}
                      onChange={(e) => saveFactoringPct(e.target.value)}
                      className="w-full h-8 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-sm px-2 focus:border-fx-orange outline-none"
                    />
                  </div>
                </div>
                {/* Breakdown table */}
                {(() => {
                  const miles = load.totalMiles ?? 0;
                  const rateUsd = load.rateUsd;
                  const fuelCost =
                    miles > 0
                      ? (miles / (parseFloat(mpg) || 6.5)) * (parseFloat(fuelPrice) || 4)
                      : 0;
                  const opCost = miles * (parseFloat(costPerMile) || 0);
                  const factoringFee = rateUsd * ((parseFloat(factoringPct) || 0) / 100);
                  const net = rateUsd - fuelCost - opCost - factoringFee;
                  const netPerMile = miles > 0 ? net / miles : 0;
                  const rows = [
                    {
                      label: 'All In Rate',
                      value: `$${rateUsd.toLocaleString()}`,
                      color: 'text-fx-text',
                    },
                    {
                      label: 'Fuel Cost',
                      value: miles > 0 ? `-$${fuelCost.toFixed(0)}` : '—',
                      color: 'text-red-400',
                    },
                    {
                      label: 'Operating',
                      value: miles > 0 ? `-$${opCost.toFixed(0)}` : '—',
                      color: 'text-red-400',
                    },
                    {
                      label: 'Factoring Fee',
                      value: factoringFee > 0 ? `-$${factoringFee.toFixed(0)}` : '$0',
                      color: factoringFee > 0 ? 'text-red-400' : 'text-fx-text-dim',
                    },
                  ];
                  return (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {rows.map((r) => (
                        <div
                          key={r.label}
                          className="flex justify-between items-center px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <span className="text-[12px] text-fx-text-muted">{r.label}</span>
                          <span className={`text-[12px] font-semibold ${r.color}`}>{r.value}</span>
                        </div>
                      ))}
                      <div
                        className="flex justify-between items-center px-3 py-2.5"
                        style={{
                          background: net >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        }}
                      >
                        <span className="text-[12px] font-bold text-fx-text">Approx. Profit</span>
                        <div className="text-right">
                          <span
                            className="text-[13px] font-black"
                            style={{ color: net >= 0 ? '#4ade80' : '#f87171' }}
                          >
                            {miles > 0 ? `$${net.toFixed(0)}` : '—'}
                          </span>
                          {miles > 0 && (
                            <span className="text-[10px] text-fx-text-dim ml-2">
                              ${netPerMile.toFixed(2)}/mi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Contact Information - Show for carriers/brokers/drivers on awarded+ loads */}
        {(isCarrier || isBroker || role === 'driver') &&
          ACTIVE_STATUSES.includes(liveStatus) &&
          (load.shipperName || load.receiverName) && (
            <div className="mb-5">
              <button
                onClick={() => toggle('contact')}
                className="w-full flex items-center justify-between mb-3"
              >
                <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
                  Contact Information
                </p>
                {expanded.contact ? (
                  <ChevronUp size={14} className="text-fx-text-dim" />
                ) : (
                  <ChevronDown size={14} className="text-fx-text-dim" />
                )}
              </button>
              {expanded.contact && (
                <>
                  {/* Shipper Contact */}
                  {load.shipperName && (
                    <div className="mb-3 p-3 rounded-xl bg-fx-surface-2 border border-fx-border">
                      <p className="text-[10px] font-bold text-fx-text-dim uppercase mb-1">
                        Shipper
                      </p>
                      <p className="text-sm font-bold text-fx-text">{load.shipperName}</p>
                      {load.shipperContactName && (
                        <p className="text-xs text-fx-text-muted mt-1">
                          Contact: {load.shipperContactName}
                        </p>
                      )}
                      {load.shipperContactPhone && (
                        <a
                          href={`tel:${load.shipperContactPhone}`}
                          className="text-xs text-fx-orange block mt-1"
                        >
                          {load.shipperContactPhone}
                        </a>
                      )}
                      {load.shipperContactEmail && (
                        <a
                          href={`mailto:${load.shipperContactEmail}`}
                          className="text-xs text-fx-orange block mt-0.5"
                        >
                          {load.shipperContactEmail}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Receiver Contact */}
                  {load.receiverName && (
                    <div className="p-3 rounded-xl bg-fx-surface-2 border border-fx-border">
                      <p className="text-[10px] font-bold text-fx-text-dim uppercase mb-1">
                        Receiver
                      </p>
                      <p className="text-sm font-bold text-fx-text">{load.receiverName}</p>
                      {load.receiverContactName && (
                        <p className="text-xs text-fx-text-muted mt-1">
                          Contact: {load.receiverContactName}
                        </p>
                      )}
                      {load.receiverContactPhone && (
                        <a
                          href={`tel:${load.receiverContactPhone}`}
                          className="text-xs text-fx-orange block mt-1"
                        >
                          {load.receiverContactPhone}
                        </a>
                      )}
                      {load.receiverContactEmail && (
                        <a
                          href={`mailto:${load.receiverContactEmail}`}
                          className="text-xs text-fx-orange block mt-0.5"
                        >
                          {load.receiverContactEmail}
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        {/* Appointment Windows - Show for carriers/brokers/drivers on awarded+ loads */}
        {(isCarrier || isBroker || role === 'driver') &&
          ACTIVE_STATUSES.includes(liveStatus) &&
          (load.pickupApptStart ||
            load.pickupApptEnd ||
            load.deliveryApptStart ||
            load.deliveryApptEnd) && (
            <div className="mb-5">
              <button
                onClick={() => toggle('appointments')}
                className="w-full flex items-center justify-between mb-3"
              >
                <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
                  Appointment Times
                </p>
                {expanded.appointments ? (
                  <ChevronUp size={14} className="text-fx-text-dim" />
                ) : (
                  <ChevronDown size={14} className="text-fx-text-dim" />
                )}
              </button>
              {expanded.appointments && (
                <>
                  {(load.pickupApptStart || load.pickupApptEnd) && (
                    <InfoRow
                      icon={<Clock size={14} />}
                      label="Pickup Window"
                      value={formatApptWindow(load.pickupApptStart, load.pickupApptEnd)}
                    />
                  )}
                  {(load.deliveryApptStart || load.deliveryApptEnd) && (
                    <InfoRow
                      icon={<Clock size={14} />}
                      label="Delivery Window"
                      value={formatApptWindow(load.deliveryApptStart, load.deliveryApptEnd)}
                    />
                  )}
                </>
              )}
            </div>
          )}

        {/* Reference Numbers & Instructions - Show for carriers/brokers/drivers on awarded+ loads */}
        {(isCarrier || isBroker || role === 'driver') &&
          ACTIVE_STATUSES.includes(liveStatus) &&
          (load.po_number ||
            load.shipper_reference ||
            load.specialInstructions ||
            load.loadingNotes ||
            load.deliveryNotes) && (
            <div className="mb-5">
              <button
                onClick={() => toggle('refs')}
                className="w-full flex items-center justify-between mb-3"
              >
                <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
                  Additional Information
                </p>
                {expanded.refs ? (
                  <ChevronUp size={14} className="text-fx-text-dim" />
                ) : (
                  <ChevronDown size={14} className="text-fx-text-dim" />
                )}
              </button>
              {expanded.refs && (
                <div className="space-y-3">
                  {load.po_number && (
                    <InfoRow
                      icon={<FileText size={14} />}
                      label="PO Number"
                      value={load.po_number}
                    />
                  )}
                  {load.shipper_reference && (
                    <InfoRow
                      icon={<FileText size={14} />}
                      label="Shipper Ref"
                      value={load.shipper_reference}
                    />
                  )}
                  {load.specialInstructions && (
                    <div className="p-3 rounded-xl bg-fx-surface-2 border border-fx-border">
                      <p className="text-[10px] font-bold text-fx-text-dim uppercase mb-2">
                        Special Instructions
                      </p>
                      <p className="text-xs text-fx-text whitespace-pre-wrap">
                        {load.specialInstructions}
                      </p>
                    </div>
                  )}
                  {load.loadingNotes && (
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                      <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">
                        📍 Pickup Location Notes
                      </p>
                      <p className="text-xs text-fx-text whitespace-pre-wrap">
                        {load.loadingNotes}
                      </p>
                    </div>
                  )}
                  {load.deliveryNotes && (
                    <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                      <p className="text-[10px] font-bold text-green-400 uppercase mb-2">
                        🚚 Delivery Location Notes
                      </p>
                      <p className="text-xs text-fx-text whitespace-pre-wrap">
                        {load.deliveryNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Broker Payment Metrics */}
        {isCarrier && load.companyId && (
          <div className="mb-5">
            <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
              Broker Payment History
            </p>
            <BrokerCreditBadge companyId={load.companyId} inline={false} />
            {acceptsFactoring !== null && (
              <div
                className="flex justify-between items-center px-3 py-2 mt-2 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span className="text-[12px] text-fx-text-muted">Factoring</span>
                {acceptsFactoring ? (
                  <span className="text-[12px] font-bold text-green-400">✓ Accepted</span>
                ) : (
                  <span className="text-[12px] font-semibold text-fx-text-dim">✗ Not Accepted</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {(load.tempControlled || load.hazmat || (load.bidCount && load.bidCount > 0)) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {load.tempControlled && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20">
                <Thermometer size={11} /> Temperature Controlled
              </div>
            )}
            {load.hazmat && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-red-400 bg-red-400/10 border border-red-400/20">
                <AlertTriangle size={11} /> HAZMAT
              </div>
            )}
            {load.bidCount && load.bidCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-fx-text-muted bg-fx-surface-2 border border-fx-border">
                {load.bidCount} {load.bidCount === 1 ? 'carrier bid' : 'carrier bids'}
              </div>
            ) : null}
          </div>
        )}

        {/* Documents section */}
        {showDocs && (
          <div className="mb-5">
            <button
              onClick={() => setDocsOpen((o) => !o)}
              className="w-full flex items-center justify-between py-2 mb-2"
            >
              <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
                Documents
              </p>
              <FileUp size={14} className="text-fx-orange" />
            </button>
            {/* Hide upload if BOL is signed or user is shipper */}
            {docsOpen && !hasSignedBol && !isShipper && (
              <DocumentUpload loadId={load.id} role={role!} />
            )}

            {/* Signed BOL — view + download */}
            {hasSignedBol && (
              <>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleViewSignedBol}
                    disabled={loadingBol}
                    className="flex-1 h-10 rounded-xl border text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors"
                    style={{
                      borderColor: 'rgba(34,197,94,0.3)',
                      color: '#4ade80',
                      background: 'rgba(34,197,94,0.06)',
                    }}
                  >
                    {loadingBol ? (
                      <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                    ) : (
                      '✓ View BOL'
                    )}
                  </button>
                  {bolDownloadUrl && (
                    <a
                      href={bolDownloadUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        borderColor: 'rgba(34,197,94,0.3)',
                        color: '#4ade80',
                        background: 'rgba(34,197,94,0.06)',
                      }}
                      title="Download signed BOL"
                    >
                      <ArrowRight size={14} className="-rotate-45" />
                    </a>
                  )}
                </div>
                {docsOpen && (
                  <div className="mt-3 text-xs text-fx-text-muted text-center">
                    BOL signed and locked. No additional uploads allowed.
                  </div>
                )}
              </>
            )}

            {/* Signed Rate Con — download for carrier */}
            {isCarrier && rateConSigned && rateConDownloadUrl && (
              <a
                href={rateConDownloadUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="mt-2 w-full h-10 rounded-xl border border-fx-orange/30 text-[12px] font-semibold text-fx-orange flex items-center justify-center gap-2 transition-colors hover:bg-fx-orange/5"
              >
                <FileText size={13} />
                Download Signed Rate Con
              </a>
            )}
          </div>
        )}

        {/* Accessorials section */}
        {showDocs && (
          <div className="mb-5">
            <button
              onClick={() => setAccessorialsOpen(true)}
              className="w-full flex items-center justify-between py-2"
            >
              <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
                Accessorial Charges
              </p>
              <span className="text-[11px] font-semibold text-fx-orange">Manage →</span>
            </button>
          </div>
        )}

        {/* Load Resources - carrier/driver only */}
        {(isCarrier || role === 'driver') && (
          <div className="mb-5">
            <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
              Load Resources
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  title: 'Factor This Load',
                  desc: 'Get paid faster with non-recourse factoring',
                  href: 'https://www.triumphbusiness.com/freight-factoring',
                },
                {
                  title: 'Per-Load Insurance',
                  desc: 'All-risk cargo coverage up to $2M',
                  href: 'https://www.truckinsurance.com',
                },
                {
                  title: 'ELD Tracking',
                  desc: 'Connect your ELD for automatic status updates',
                  href: 'https://www.samsara.com',
                },
                {
                  title: 'Cross-Border Services',
                  desc: 'eManifest and customs filing',
                  href: 'https://www.borderconnect.com',
                },
              ].map((resource) => (
                <a
                  key={resource.title}
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl flex flex-col gap-1.5 hover:border-fx-orange/30 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-[12px] font-bold text-fx-text">{resource.title}</p>
                  <p className="text-[10px] text-fx-text-dim leading-snug">{resource.desc}</p>
                  <span className="text-[10px] font-semibold text-fx-orange mt-0.5">
                    Learn More →
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Broker: view bids + rate con + cancel */}
          {isBroker && (
            <>
              {ACTIVE_STATUSES.includes(liveStatus) && liveStatus !== 'posted' && (
                <button
                  onClick={() =>
                    generateRateCon({
                      load,
                      carrierName: 'Carrier',
                      brokerName: load.companyName,
                    })
                  }
                  className="w-full h-11 rounded-2xl border border-fx-orange/40 text-sm font-semibold text-fx-orange flex items-center justify-center gap-2 hover:bg-fx-orange/5 transition-colors"
                >
                  ⬇ Download Rate Confirmation
                </button>
              )}
              <button
                onClick={() => setBidListOpen(true)}
                className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold bg-fx-surface border border-fx-border text-fx-text hover:border-fx-orange/50 transition-all"
              >
                <Users size={16} />
                View Bids
                {load.bidCount && load.bidCount > 0 ? ` · ${load.bidCount}` : ''}
              </button>

              {canEdit && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="w-full h-11 rounded-2xl border border-fx-orange/40 text-sm font-semibold text-fx-orange flex items-center justify-center gap-2 hover:bg-fx-orange/5 transition-colors"
                >
                  <Pencil size={14} />
                  Edit Load
                </button>
              )}

              {(liveStatus === 'posted' ||
                liveStatus === 'bid_received' ||
                liveStatus === 'awarded') &&
                (cancelConfirm ? (
                  <div className="flex flex-col gap-2">
                    {liveStatus === 'awarded' && (
                      <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                        Warning: This load has been awarded to a carrier. Cancelling may impact your
                        reputation.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCancelConfirm(false)}
                        className="flex-1 h-11 rounded-2xl border border-fx-border text-sm font-bold text-fx-text-muted"
                      >
                        Keep Load
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 h-11 rounded-2xl bg-red-500 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {cancelling ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        ) : (
                          'Yes, Cancel Load'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="w-full h-11 rounded-2xl border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Cancel Load
                  </button>
                ))}
            </>
          )}

          {/* Carrier: bid now + book now */}
          {isCarrier && showBidButton && liveStatus === 'posted' && (
            <>
              {bookError && (
                <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
                  {bookError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setBidOpen(true)}
                  className="flex-1 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold text-white active-scale bg-orange-gradient"
                  style={{ boxShadow: '0 4px 20px rgba(232,96,48,0.4)', height: '52px' }}
                >
                  <Zap size={16} fill="currentColor" />
                  Bid Now
                </button>
                <button
                  onClick={handleBookNow}
                  disabled={booking}
                  className="flex-1 h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold bg-green-500 text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {booking ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>⚡ Book Now</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Carrier: already bid / awarded */}
          {isCarrier && liveStatus !== 'posted' && (
            <div className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold text-fx-text-muted bg-fx-surface border border-fx-border">
              {liveStatus === 'awarded'
                ? '🎉 Load Awarded'
                : `Status: ${liveStatus.replace('_', ' ')}`}
            </div>
          )}

          {/* Carrier: message broker button on awarded+ loads */}
          {isCarrier && ACTIVE_STATUSES.includes(liveStatus) && load.postedBy && (
            <button
              onClick={handleMessageBroker}
              disabled={messaging}
              className="w-full h-11 rounded-2xl border border-fx-border text-sm font-semibold text-fx-text-muted flex items-center justify-center gap-2 hover:border-fx-orange/40 hover:text-fx-orange transition-colors disabled:opacity-50"
            >
              {messaging ? (
                <span className="w-4 h-4 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
              ) : (
                <>
                  <MessageSquare size={14} />
                  Message Broker
                </>
              )}
            </button>
          )}

          {/* Shipper actions */}
          {isShipper && (
            <>
              {liveStatus === 'in_transit' && (
                <button
                  onClick={() => navigate(`/track/${load.loadNumber}`)}
                  className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold text-white bg-orange-gradient active-scale"
                  style={{ boxShadow: '0 4px 20px rgba(232,96,48,0.4)' }}
                >
                  Track Shipment →
                </button>
              )}
              {liveStatus === 'delivered' && !receiptConfirmed && (
                <button
                  onClick={handleConfirmReceipt}
                  disabled={confirmingReceipt}
                  className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold text-white disabled:opacity-50 active-scale"
                  style={{
                    background: 'linear-gradient(145deg, #22c55e, #16a34a)',
                    boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
                  }}
                >
                  {confirmingReceipt ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    '✓ Confirm Receipt'
                  )}
                </button>
              )}
              {liveStatus === 'delivered' && receiptConfirmed && (
                <div className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-green-400 bg-green-500/10 border border-green-500/20">
                  ✓ Receipt Confirmed
                </div>
              )}
              {load.postedBy && (
                <button
                  onClick={handleMessageBroker}
                  disabled={messaging}
                  className="w-full h-11 rounded-2xl border border-fx-border text-sm font-semibold text-fx-text-muted flex items-center justify-center gap-2 hover:border-fx-orange/40 hover:text-fx-orange transition-colors disabled:opacity-50"
                >
                  {messaging ? (
                    <span className="w-4 h-4 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
                  ) : (
                    <>
                      <MessageSquare size={14} />
                      Message Broker
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </BottomSheet>

      {/* Nested sheets */}
      <BidSheet open={bidOpen} onClose={() => setBidOpen(false)} load={load} />

      <BidListSheet
        open={bidListOpen}
        onClose={() => setBidListOpen(false)}
        load={load}
        onBidAccepted={() => setBidListOpen(false)}
      />

      <EditLoadSheet
        load={editOpen ? load : null}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          setEditOpen(false);
          onClose(); // Close detail sheet so parent can refresh
        }}
      />

      <AccessorialsSheet
        open={accessorialsOpen}
        onClose={() => setAccessorialsOpen(false)}
        loadId={load.id}
        baseRate={load.rateUsd}
        role={(role ?? 'carrier') as UserRole}
      />

      {signedBolDoc && (
        <SignedBolViewer doc={signedBolDoc} load={load} onClose={() => setSignedBolDoc(null)} />
      )}

      <AssignDriverSheet
        open={assignDriverOpen}
        onClose={() => setAssignDriverOpen(false)}
        load={load}
        onAssigned={() => {
          setAssignDriverOpen(false);
          setDriverAssigned(true);
        }}
      />

      {rateConOpen && user && (
        <RateConSignatureSheet
          open={rateConOpen}
          onClose={() => setRateConOpen(false)}
          load={load}
          carrierName={company?.name ?? 'Carrier'}
          brokerName={load.companyName}
          uploadedBy={user.id}
          onSigned={() => {
            setRateConOpen(false);
            setRateConSigned(true);
            if (!driverAssigned) setAssignDriverOpen(true);
          }}
        />
      )}
    </>
  );
}
