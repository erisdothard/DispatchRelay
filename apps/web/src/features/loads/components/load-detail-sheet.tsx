import { useState } from 'react';
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
import { AccessorialsSheet } from './accessorials-sheet';
import { bookNow } from '@/services/bids.service';
import { updateLoad } from '@/services/loads.service';
import { generateRateCon } from '@/features/bookings/lib/generate-rate-con';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Load } from '@freightx/shared';
import type { LoadStatus, UserRole } from '@/lib/database.types';

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
  const [bidOpen, setBidOpen] = useState(false);
  const [bidListOpen, setBidListOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [accessorialsOpen, setAccessorialsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<LoadStatus | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
  const showDocs = ACTIVE_STATUSES.includes(liveStatus) && role && role !== 'shipper';
  const isBroker = role === 'broker' || role === 'admin';
  const isCarrier = role === 'carrier';

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
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-fx-text-muted uppercase tracking-widest mb-0.5">
                Origin
              </p>
              <p className="text-[17px] font-extrabold text-white tracking-tight">
                {load.originCity}, {load.originState}
              </p>
            </div>
            <ArrowRight size={20} className="text-fx-orange shrink-0" strokeWidth={2.5} />
            <div className="flex-1 text-right">
              <p className="text-[11px] font-bold text-fx-text-muted uppercase tracking-widest mb-0.5">
                Destination
              </p>
              <p className="text-[17px] font-extrabold text-white tracking-tight">
                {load.destCity}, {load.destState}
              </p>
            </div>
          </div>
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
              onStatusAdvanced={(s) => setCurrentStatus(s)}
            />
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
          <InfoRow icon={<MapPin size={14} />} label="Broker" value={load.companyName} />
          {age && <InfoRow icon={<Clock size={14} />} label="Posted" value={age} />}
          {load.loadNumber && (
            <InfoRow icon={<Package size={14} />} label="Load #" value={load.loadNumber} />
          )}
        </div>

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
            {docsOpen && <DocumentUpload loadId={load.id} role={role!} />}
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

              {liveStatus !== 'cancelled' &&
                liveStatus !== 'completed' &&
                liveStatus !== 'delivered' &&
                (cancelConfirm ? (
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

      <AccessorialsSheet
        open={accessorialsOpen}
        onClose={() => setAccessorialsOpen(false)}
        loadId={load.id}
        baseRate={load.rateUsd}
        role={role ?? 'carrier'}
      />
    </>
  );
}
