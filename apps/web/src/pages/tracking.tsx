import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Phone, Search, MapPin, Navigation } from 'lucide-react';
import { MapView } from '@/shared/components/map-view';
import { useParams, useNavigate } from 'react-router-dom';
import { IOSStatusBar } from '@/shared/components/ios-status-bar';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useAuth } from '@/contexts/AuthContext';
import { getLoadByNumber, getTrackingMilestones } from '@/services/loads.service';
import { useLiveTracking } from '@/features/loads/hooks/use-live-tracking';
import type { Load, TrackingMilestone } from '@freightx/shared';

export default function TrackingPage() {
  const { loadId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [query, setQuery] = useState(loadId ?? '');
  const [load, setLoad] = useState<Load | null>(null);
  const [milestones, setMilestones] = useState<TrackingMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchTracking(id: string) {
    if (!id.trim()) return;
    setLoading(true);
    setNotFound(false);
    setLoad(null);
    setMilestones([]);
    const [foundLoad, foundMilestones] = await Promise.all([
      getLoadByNumber(id.trim().toUpperCase()),
      getTrackingMilestones(id.trim().toUpperCase()),
    ]);
    setLoading(false);
    if (!foundLoad) {
      setNotFound(true);
      return;
    }
    setLoad(foundLoad);
    setMilestones(foundMilestones);
  }

  // Auto-fetch when navigated with a loadId param
  useEffect(() => {
    if (loadId) fetchTracking(loadId);
  }, [loadId]);

  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;
  const role = (profile?.role === 'admin' ? 'carrier' : profile?.role) ?? 'carrier';

  // Live GPS tracking — only subscribes when a load is loaded
  const livePing = useLiveTracking(load?.loadNumber ?? null);
  const livePosition: [number, number] | undefined =
    livePing ? [livePing.latitude, livePing.longitude] : undefined;
  const heading = livePing?.heading_deg ?? undefined;

  // Human-readable speed (km/h) and accuracy
  const speedKmh =
    livePing?.speed_ms != null ? Math.round(livePing.speed_ms * 3.6) : null;
  const accuracyM = livePing?.accuracy_m ?? null;

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <IOSStatusBar />

      {/* Navigation header */}
      <div className="flex items-center justify-between px-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-fx-surface flex items-center justify-center card-highlight active-scale"
        >
          <ArrowLeft size={17} className="text-white" strokeWidth={2.5} />
        </button>
        <p className="text-[17px] font-semibold text-white tracking-[-0.01em]">Tracking Shipment</p>
        <button
          onClick={() => load && setMenuOpen(true)}
          className={`w-9 h-9 rounded-full bg-fx-surface flex items-center justify-center card-highlight active-scale ${!load ? 'opacity-40' : ''}`}
        >
          <MoreVertical size={17} className="text-fx-text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 space-y-4 pb-2">
        {/* Search bar */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter load # (e.g. FX-20260217-0042)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTracking(query)}
            className="flex-1 h-12 bg-fx-surface border border-fx-border rounded-ios-xs px-4 text-[14px] text-white placeholder:text-fx-text-dim focus:ring-1 focus:ring-fx-orange/50 outline-none card-highlight"
          />
          <button
            onClick={() => fetchTracking(query)}
            disabled={loading}
            className="w-12 h-12 bg-fx-orange rounded-ios-xs flex items-center justify-center shrink-0 active-scale"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={17} className="text-white" />
            )}
          </button>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-bold text-fx-text">Load not found</p>
            <p className="text-sm text-fx-text-muted mt-1">Check the load number and try again</p>
          </div>
        )}

        {/* Empty state — no search yet */}
        {!load && !notFound && !loading && !loadId && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">📍</div>
            <p className="font-bold text-fx-text">Track a shipment</p>
            <p className="text-sm text-fx-text-muted mt-1">
              Enter a load number above to get started
            </p>
          </div>
        )}

        {load && (
          <>
            {/* Info grid */}
            <div className="bg-fx-surface rounded-ios p-5 card-highlight">
              <div className="grid grid-cols-2 gap-y-5">
                {[
                  { label: 'Load #', value: load.loadNumber, accent: false },
                  { label: 'Company', value: load.companyName, accent: false },
                  {
                    label: 'From',
                    value: `${load.originCity}, ${load.originState}`,
                    accent: false,
                  },
                  { label: 'To', value: `${load.destCity}, ${load.destState}`, accent: false },
                  {
                    label: 'Status',
                    value:
                      load.status === 'in_transit'
                        ? 'In Transit'
                        : load.status === 'delivered'
                          ? 'Delivered'
                          : 'Posted',
                    accent: true,
                  },
                  {
                    label: 'Weight',
                    value: `${load.weightLbs.toLocaleString()} lbs`,
                    accent: false,
                  },
                ].map(({ label, value, accent }) => (
                  <div key={label}>
                    <p className="text-[11px] text-fx-text-dim font-medium mb-1 uppercase tracking-wide">
                      {label}
                    </p>
                    <p
                      className={`text-[14px] font-semibold tracking-[-0.01em] ${accent ? 'text-fx-orange' : 'text-white'}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-fx-surface rounded-ios p-4 card-highlight">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Live Tracking</p>
                {load.status === 'in_transit' && livePosition && (
                  <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
                {load.status === 'in_transit' && !livePosition && (
                  <span className="text-xs text-fx-text-dim font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-fx-text-dim rounded-full" />
                    Awaiting GPS
                  </span>
                )}
              </div>

              <MapView
                origin={{ city: load.originCity, state: load.originState }}
                destination={{ city: load.destCity, state: load.destState }}
                progress={progress}
                inTransit={load.status === 'in_transit'}
                livePosition={livePosition}
                heading={heading}
                className="h-44 mb-3"
              />

              {/* Distance info */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-green-400" />
                  <span className="text-fx-text-dim">
                    Pickup:{' '}
                    {load.pickupDate ? new Date(load.pickupDate + 'T12:00:00').toLocaleDateString() : 'TBD'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation size={12} className="text-fx-orange" />
                  <span className="text-fx-text-dim">
                    Delivery:{' '}
                    {load.deliveryDate ? new Date(load.deliveryDate + 'T12:00:00').toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              </div>

              {/* Live GPS telemetry — shown only when real pings are available */}
              {livePosition && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5 text-[11px] text-fx-text-dim">
                  {speedKmh != null && (
                    <span className="flex items-center gap-1">
                      <span className="text-fx-orange font-semibold">{speedKmh}</span> km/h
                    </span>
                  )}
                  {accuracyM != null && (
                    <span className="flex items-center gap-1">
                      ±<span className="text-white/60 font-semibold">{accuracyM}</span> m accuracy
                    </span>
                  )}
                  <span className="ml-auto text-green-400 font-semibold">GPS</span>
                </div>
              )}
            </div>

            {/* Contact card */}
            <div className="bg-fx-surface rounded-ios p-4 flex items-center gap-3 card-highlight">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 card-orange-highlight"
                style={{ background: 'linear-gradient(145deg, #F07040, #C03A12)' }}
              >
                <span className="text-sm font-bold text-white">FX</span>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-white tracking-[-0.01em]">
                  FreightX Support
                </p>
                <p className="text-[12px] text-fx-text-dim mt-0.5">Customer Services</p>
              </div>
              <button
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 active-scale"
                style={{
                  background: 'linear-gradient(145deg, #F07040, #C03A12)',
                  boxShadow: '0 4px 16px rgba(232,96,48,0.4)',
                }}
              >
                <Phone size={17} className="text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Progress bar */}
            {milestones.length > 0 && (
              <div className="bg-fx-surface rounded-ios p-5 card-highlight">
                <div className="relative my-1 mb-5">
                  <div className="w-full h-[3px] bg-fx-border rounded-full" />
                  <div
                    className="absolute left-0 top-0 h-[3px] rounded-full bg-orange-gradient"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-orange-gradient ring-2 ring-fx-bg" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full bg-orange-gradient ring-[3px] ring-fx-bg"
                    style={{ left: `${progress}%`, boxShadow: '0 0 12px rgba(232,96,48,0.6)' }}
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[14px] h-[14px] rounded-full bg-fx-border ring-2 ring-fx-bg" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-fx-text-dim">
                      {new Date(load.pickupDate + 'T12:00:00').toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[15px] font-bold text-white tracking-[-0.01em] mt-0.5">
                      {load.originCity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-fx-text-dim">
                      Est.{' '}
                      {new Date(load.deliveryDate + 'T12:00:00').toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[15px] font-bold text-white tracking-[-0.01em] mt-0.5">
                      {load.destCity}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Milestone detail */}
            {milestones.length > 0 && (
              <div className="bg-fx-surface rounded-ios overflow-hidden card-highlight">
                <div
                  className="px-5 py-3.5 text-center"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[14px] font-semibold text-white tracking-[-0.01em]">
                    Detail Status
                  </p>
                </div>
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between px-5 py-4"
                    style={
                      i < milestones.length - 1
                        ? { borderBottom: '1px solid rgba(255,255,255,0.05)' }
                        : {}
                    }
                  >
                    <div className="flex-1">
                      <p
                        className={`text-[14px] font-semibold tracking-[-0.01em] ${m.current ? 'text-fx-orange' : m.completed ? 'text-white' : 'text-fx-text-dim'}`}
                      >
                        {m.label}
                      </p>
                      <p className="text-[12px] text-fx-text-dim mt-0.5">{m.location}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p
                        className={`text-[14px] font-bold tracking-tight ${m.current || m.completed ? 'text-fx-orange' : 'text-fx-text-dim'}`}
                      >
                        {m.timestamp?.split('·')[1]?.trim() ?? '—'}
                      </p>
                      <p className="text-[11px] text-fx-text-dim mt-0.5">
                        {m.timestamp?.split('·')[0]?.trim()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav role={role} />

      {/* 3-dot action sheet */}
      {menuOpen && load && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMenuOpen(false)} />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
            style={{ maxWidth: 430, margin: '0 auto' }}
          >
            <div className="bg-fx-surface rounded-t-[24px] pb-safe overflow-hidden card-highlight">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-fx-border" />
              </div>
              {/* Label */}
              <p className="text-center text-[13px] text-fx-text-dim font-medium py-2 px-5">
                {load.loadNumber}
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Copy Load # */}
                <button
                  className="w-full h-14 flex items-center justify-center text-[16px] font-medium text-white active-scale"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={async () => {
                    await navigator.clipboard.writeText(load.loadNumber);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    setMenuOpen(false);
                  }}
                >
                  {copied ? 'Copied!' : 'Copy Load #'}
                </button>
                {/* Share */}
                <button
                  className="w-full h-14 flex items-center justify-center text-[16px] font-medium text-white active-scale"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={async () => {
                    const shareData = {
                      title: `FreightX — ${load.loadNumber}`,
                      text: `Track load ${load.loadNumber}: ${load.originCity}, ${load.originState} → ${load.destCity}, ${load.destState}`,
                      url: window.location.href,
                    };
                    if (navigator.share) {
                      await navigator.share(shareData).catch(() => null);
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                    }
                    setMenuOpen(false);
                  }}
                >
                  Share Tracking Link
                </button>
                {/* Refresh */}
                <button
                  className="w-full h-14 flex items-center justify-center text-[16px] font-medium text-white active-scale"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => {
                    setMenuOpen(false);
                    void fetchTracking(load.loadNumber);
                  }}
                >
                  Refresh
                </button>
                {/* Cancel */}
                <button
                  className="w-full h-14 flex items-center justify-center text-[16px] font-semibold text-fx-orange active-scale"
                  onClick={() => setMenuOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
