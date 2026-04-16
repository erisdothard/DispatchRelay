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
import { updateLoad } from '@/services/loads.service';
import { generateRateCon } from '@/features/bookings/lib/generate-rate-con';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Load } from '@freightx/shared';
import type { LoadStatus, UserRole } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';

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
  const [rateConOpen, setRateConOpen] = useState(false);
  const [accessorialsOpen, setAccessorialsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<LoadStatus | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [assignDriverOpen, setAssignDriverOpen] = useState(false);
  // Profit estimator
  const [profitExpanded, setProfitExpanded] = useState(false);
  const [costPerMile, setCostPerMile] = useState<string>(
    () => localStorage.getItem('fx_carrier_cpp') ?? '1.80',
  );
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
      } catch {
        setHasSignedBol(false);
      }
    }

    checkDocStatus();
  }, [load?.id]);

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
              hasDriverAssigned={!!load.assignedDriverId}
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

        {/* Assign Driver - for carrier on awarded/dispatched loads without driver */}
        {isCarrier && ['awarded', 'dispatched'].includes(liveStatus) && !load.assignedDriverId && (
          <div className="mb-5">
            <button
              onClick={() => setAssignDriverOpen(true)}
              className="w-full h-11 rounded-2xl border border-fx-orange/40 text-sm font-semibold text-fx-orange flex items-center justify-center gap-2 hover:bg-fx-orange/5 transition-colors"
            >
              <UserCheck size={14} />
              Assign Driver
            </button>
          </div>
        )}

        {/* Detail rows */}
        <div className="mb-5">
          <InfoRow icon={<Calendar size={14} />} label="Pickup" value={pickupFmt} />
          <InfoRow icon={<Calendar size={14} />} label="Delivery" value={deliveryFmt} />
          <InfoRow
            icon={<Package size={14} />}
            label="Equipment"
            value={EQUIPMENT_LABELS[load.equipment] ?? load.equipment}
          />
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

          {/* Additional freight details - show after award */}
          {ACTIVE_STATUSES.includes(liveStatus) && (
            <>
              {load.freight_class && (
                <InfoRow
                  icon={<Package size={14} />}
                  label="Freight Class"
                  value={load.freight_class}
                />
              )}
              {load.packaging_type && (
                <InfoRow
                  icon={<Package size={14} />}
                  label="Packaging"
                  value={load.packaging_type}
                />
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
          )}
        </div>

        {/* Profit Estimator - carrier only, any load with a rate */}
        {isCarrier && load.rateUsd > 0 && (
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
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-fx-text-muted whitespace-nowrap">
                    My cost/mile ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerMile}
                    onChange={(e) => saveCostPerMile(e.target.value)}
                    className="w-24 h-8 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-sm px-2 focus:border-fx-orange outline-none"
                  />
                  <span className="text-[10px] text-fx-text-dim">saved automatically</span>
                </div>
                {(() => {
                  const cpp = parseFloat(costPerMile) || 0;
                  const miles = load.totalMiles ?? 0;
                  const revenue = load.rateUsd;
                  const fuelAndOps = miles * cpp;
                  const net = revenue - fuelAndOps;
                  const netPerMile = miles > 0 ? net / miles : 0;
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-fx-surface-2 border border-fx-border rounded-xl p-3 text-center">
                        <p className="text-[10px] text-fx-text-dim mb-1">Revenue</p>
                        <p className="text-sm font-bold text-fx-text">
                          ${revenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-fx-surface-2 border border-fx-border rounded-xl p-3 text-center">
                        <p className="text-[10px] text-fx-text-dim mb-1">Est. Cost</p>
                        <p className="text-sm font-bold text-red-400">
                          {miles > 0 ? `-$${fuelAndOps.toFixed(0)}` : '—'}
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3 text-center border"
                        style={{
                          background: net >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                          borderColor: net >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        }}
                      >
                        <p className="text-[10px] text-fx-text-dim mb-1">Net</p>
                        <p
                          className="text-sm font-bold"
                          style={{ color: net >= 0 ? '#4ade80' : '#f87171' }}
                        >
                          {miles > 0 ? `$${net.toFixed(0)}` : '—'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                {load.totalMiles && parseFloat(costPerMile) > 0 && (
                  <p className="text-[10px] text-fx-text-dim text-center">
                    {load.totalMiles} miles ×{' '}
                    <span className="text-fx-text">${parseFloat(costPerMile).toFixed(2)}/mi</span>{' '}
                    operating cost estimate
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contact Information - Show for carriers/brokers on awarded+ loads */}
        {(isCarrier || isBroker) &&
          ACTIVE_STATUSES.includes(liveStatus) &&
          (load.shipperName || load.receiverName) && (
            <div className="mb-5">
              <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
                Contact Information
              </p>

              {/* Shipper Contact */}
              {load.shipperName && (
                <div className="mb-3 p-3 rounded-xl bg-fx-surface-2 border border-fx-border">
                  <p className="text-[10px] font-bold text-fx-text-dim uppercase mb-1">Shipper</p>
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
                  <p className="text-[10px] font-bold text-fx-text-dim uppercase mb-1">Receiver</p>
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
            </div>
          )}

        {/* Appointment Windows - Show for carriers/drivers on awarded+ loads */}
        {(isCarrier || role === 'driver') &&
          ACTIVE_STATUSES.includes(liveStatus) &&
          (load.pickupApptStart ||
            load.pickupApptEnd ||
            load.deliveryApptStart ||
            load.deliveryApptEnd) && (
            <div className="mb-5">
              <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
                Appointment Times
              </p>

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
            </div>
          )}

        {/* Reference Numbers & Instructions - Show for carriers/brokers on awarded+ loads */}
        {(isCarrier || isBroker) &&
          ACTIVE_STATUSES.includes(liveStatus) &&
          (load.po_number ||
            load.shipper_reference ||
            load.specialInstructions ||
            load.loadingNotes ||
            load.deliveryNotes) && (
            <div className="mb-5">
              <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
                Additional Information
              </p>

              <div className="space-y-3">
                {load.po_number && (
                  <InfoRow icon={<FileText size={14} />} label="PO Number" value={load.po_number} />
                )}
                {load.shipper_reference && (
                  <InfoRow
                    icon={<FileText size={14} />}
                    label="Shipper Ref"
                    value={load.shipper_reference}
                  />
                )}

                {/* Special Instructions */}
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

                {/* Loading Notes (dock info, gate codes) */}
                {load.loadingNotes && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">
                      📍 Pickup Location Notes
                    </p>
                    <p className="text-xs text-fx-text whitespace-pre-wrap">{load.loadingNotes}</p>
                  </div>
                )}

                {/* Delivery Notes */}
                {load.deliveryNotes && (
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <p className="text-[10px] font-bold text-green-400 uppercase mb-2">
                      🚚 Delivery Location Notes
                    </p>
                    <p className="text-xs text-fx-text whitespace-pre-wrap">{load.deliveryNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Broker Payment Metrics */}
        {isCarrier && load.companyId && (
          <div className="mb-5">
            <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
              Broker Payment History
            </p>
            <BrokerCreditBadge companyId={load.companyId} inline={false} />
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
            {/* Hide upload if BOL is signed */}
            {docsOpen && !hasSignedBol && <DocumentUpload loadId={load.id} role={role!} />}

            {/* Only show if signed BOL exists */}
            {hasSignedBol && (
              <>
                <button
                  onClick={handleViewSignedBol}
                  disabled={loadingBol}
                  className="mt-2 w-full h-10 rounded-xl border text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{
                    borderColor: 'rgba(34,197,94,0.3)',
                    color: '#4ade80',
                    background: 'rgba(34,197,94,0.06)',
                  }}
                >
                  {loadingBol ? (
                    <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                  ) : (
                    '✓ View Signed BOL'
                  )}
                </button>
                {docsOpen && (
                  <div className="mt-3 text-xs text-fx-text-muted text-center">
                    BOL signed and locked. No additional uploads allowed.
                  </div>
                )}
              </>
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
          onClose(); // Close detail sheet so parent can refresh
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
          }}
        />
      )}
    </>
  );
}
