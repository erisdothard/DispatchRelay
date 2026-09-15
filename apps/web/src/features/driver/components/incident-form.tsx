import { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { createDriverIncident, uploadIncidentPhoto } from '@/services/driver-incidents.service';
import type { IncidentType, IncidentSeverity } from '@/services/driver-incidents.service';
import { getDriverLoads } from '@/services/loads.service';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoActive } from '@/lib/demo/demo-session';
import { INCIDENT_TYPE_ICONS } from '@/features/driver/lib/incident-type-icons';
import type { Load } from '@dispatchrelay/shared';

interface IncidentFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'tire', label: 'Tire Issue' },
  { value: 'engine', label: 'Engine / Mechanical' },
  { value: 'brake', label: 'Brakes' },
  { value: 'lights', label: 'Lights / Electrical' },
  { value: 'body_damage', label: 'Body Damage' },
  { value: 'accident', label: 'Accident' },
  { value: 'driver_illness', label: 'Driver Illness' },
  { value: 'cargo', label: 'Cargo Issue' },
  { value: 'fuel', label: 'Fuel / DEF' },
  { value: 'other', label: 'Other' },
];

const SEVERITIES: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: 'minor', label: 'Minor', color: 'var(--fx-text-muted)' },
  { value: 'moderate', label: 'Moderate', color: '#E86030' },
  { value: 'severe', label: 'Severe', color: 'var(--fx-danger)' },
  { value: 'critical', label: 'Critical', color: 'var(--fx-danger)' },
];

export function IncidentForm({ open, onClose, onCreated }: IncidentFormProps) {
  const { user } = useAuth();
  const [incidentType, setIncidentType] = useState<IncidentType>('tire');
  const [severity, setSeverity] = useState<IncidentSeverity>('minor');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadNumber, setLoadNumber] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLoads, setActiveLoads] = useState<Load[]>([]);
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Auto-fill GPS on open (demo personas never prompt the viewer for location)
  useEffect(() => {
    if (open && !isDemoActive() && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationText((prev) =>
            prev ? prev : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        },
        () => undefined,
        { timeout: 8000 },
      );
    }
  }, [open]);

  // Fetch active loads for association
  useEffect(() => {
    if (!open || !user?.id) return;
    getDriverLoads(user.id)
      .then((loads) =>
        setActiveLoads(
          loads.filter((l) => ['in_transit', 'dispatched', 'awarded'].includes(l.status)),
        ),
      )
      .catch(() => undefined);
  }, [open, user?.id]);

  async function handlePhoto(file: File | undefined) {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const url = await uploadIncidentPhoto(file, user.id);
      setPhotos((prev) => [...prev, url]);
    } catch {
      setError('Photo upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    try {
      await createDriverIncident({
        driverId: user.id,
        loadNumber: loadNumber || undefined,
        incidentType,
        severity,
        description: description || undefined,
        locationText: locationText || undefined,
        lat,
        lng,
        incidentDate,
        photos,
      });
      // Reset
      setIncidentType('tire');
      setSeverity('minor');
      setDescription('');
      setLocationText('');
      setIncidentDate(new Date().toISOString().split('T')[0]);
      setLoadNumber('');
      setPhotos([]);
      setLat(undefined);
      setLng(undefined);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save incident');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const inputClass =
    'w-full h-11 bg-fx-surface-2 border border-fx-border rounded-xl text-fx-text text-sm px-3 focus:border-fx-orange outline-none transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-3xl"
        style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-white">Log Incident</h2>
          <button onClick={onClose} className="text-fx-text-dim hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-5">
          {/* Incident Type */}
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Incident Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {INCIDENT_TYPES.map((t) => {
                const selected = incidentType === t.value;
                const Icon = INCIDENT_TYPE_ICONS[t.value];
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setIncidentType(t.value)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all text-left"
                    style={
                      selected
                        ? {
                            background: 'rgba(232,96,48,0.18)',
                            border: '1px solid rgba(232,96,48,0.6)',
                            color: '#E86030',
                          }
                        : {
                            background: 'var(--fx-surface-2)',
                            border: '1px solid var(--fx-border)',
                            color: 'rgba(255,255,255,0.55)',
                          }
                    }
                  >
                    <Icon size={16} aria-hidden="true" className="shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity */}
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Severity
            </p>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => {
                const selected = severity === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
                    style={
                      selected
                        ? {
                            background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${s.color} 38%, transparent)`,
                            color: s.color,
                          }
                        : {
                            background: 'var(--fx-surface-2)',
                            border: '1px solid var(--fx-border)',
                            color: 'var(--fx-text-dim)',
                          }
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Date
            </p>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              required
              className={inputClass}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Location */}
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Location
            </p>
            <input
              type="text"
              placeholder="Auto-filled from GPS or enter manually"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Associate Load */}
          {activeLoads.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
                Load (Optional)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLoadNumber('')}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                  style={
                    !loadNumber
                      ? {
                          background: 'rgba(232,96,48,0.15)',
                          border: '1px solid rgba(232,96,48,0.4)',
                          color: '#E86030',
                        }
                      : {
                          background: 'var(--fx-surface-2)',
                          border: '1px solid var(--fx-border)',
                          color: 'var(--fx-text-dim)',
                        }
                  }
                >
                  None
                </button>
                {activeLoads.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLoadNumber(l.loadNumber)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                    style={
                      loadNumber === l.loadNumber
                        ? {
                            background: 'rgba(232,96,48,0.15)',
                            border: '1px solid rgba(232,96,48,0.4)',
                            color: '#E86030',
                          }
                        : {
                            background: 'var(--fx-surface-2)',
                            border: '1px solid var(--fx-border)',
                            color: 'var(--fx-text-dim)',
                          }
                    }
                  >
                    {l.loadNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Description
            </p>
            <textarea
              placeholder="Describe what happened…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-fx-surface-2 border border-fx-border rounded-xl text-fx-text text-sm px-3 py-2.5 focus:border-fx-orange outline-none resize-none transition-all"
            />
          </div>

          {/* Photos */}
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Photos
            </p>
            <div className="flex gap-2 flex-wrap">
              {photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-16 h-16 rounded-xl object-cover border border-fx-border"
                />
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-xl border border-dashed border-fx-orange/40 flex flex-col items-center justify-center text-fx-orange hover:bg-fx-orange/5 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={14} />
                    <span className="text-[9px] mt-0.5">File</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-xl border border-dashed border-fx-orange/40 flex flex-col items-center justify-center text-fx-orange hover:bg-fx-orange/5 transition-colors disabled:opacity-50"
              >
                <Camera size={14} />
                <span className="text-[9px] mt-0.5">Camera</span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
          </div>

          {error && (
            <p className="text-sm text-fx-danger bg-fx-danger-dim rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl font-bold text-sm bg-fx-surface-2 text-fx-text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg,#F07040,#C03A12)' }}
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Incident'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
