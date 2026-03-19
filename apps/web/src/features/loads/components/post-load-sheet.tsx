import { useState, useEffect, useCallback } from 'react';
import { BookmarkPlus, Bookmark, TrendingUp, Loader2, ChevronDown } from 'lucide-react';
import { BottomSheet } from '@/shared/components/bottom-sheet';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { createLoad } from '@/services/loads.service';
import { useAuth } from '@/contexts/AuthContext';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { EquipmentType } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { getLaneStats, suggestRate } from '@/services/rate-intelligence.service';
import type { RateSuggestion, LaneStats } from '@/services/rate-intelligence.service';

const EQUIPMENT_OPTIONS: EquipmentType[] = [
  'van',
  'reefer',
  'flatbed',
  'step_deck',
  'lowboy',
  'tanker',
  'box_truck',
  'sprinter',
];

function genLoadNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `FX-${date}-${seq}`;
}

function titleCase(s: string): string {
  return s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const EMPTY_FORM = {
  originAddress: '',
  originCity: '',
  originState: '',
  originZip: '',
  destAddress: '',
  destCity: '',
  destState: '',
  destZip: '',
  pickupDate: '',
  deliveryDate: '',
  equipment: 'van' as EquipmentType,
  commodity: '',
  weightLbs: '',
  rateUsd: '',
  totalMiles: '',
  hazmat: false,
  tempControlled: false,
};

interface LoadTemplate {
  id: string;
  name: string;
  template_data: typeof EMPTY_FORM;
}

interface PostLoadSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function PostLoadSheet({ open, onClose, onCreated }: PostLoadSheetProps) {
  const { user, company } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Templates
  const [templates, setTemplates] = useState<LoadTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Rate suggestion
  const [rateSuggestion, setRateSuggestion] = useState<RateSuggestion | null>(null);
  const [laneStats, setLaneStats] = useState<LaneStats | null>(null);
  const [fetchingRate, setFetchingRate] = useState(false);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, val: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Load templates when sheet opens
  useEffect(() => {
    if (!open || !user?.id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('load_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: LoadTemplate[] | null }) => setTemplates(data ?? []));
  }, [open, user?.id]);

  // Fetch lane stats + rate suggestion when origin/dest/equipment/miles are filled
  const fetchRateSuggestion = useCallback(async () => {
    const { originState, destState, equipment, totalMiles } = form;
    if (!originState || !destState || !equipment || !totalMiles) return;

    const miles = parseInt(totalMiles);
    if (isNaN(miles) || miles < 1) return;

    setFetchingRate(true);
    try {
      const stats = await getLaneStats({ originState, destState, equipment });
      setLaneStats(stats);

      const suggestion = await suggestRate({
        originState,
        destState,
        equipment,
        totalMiles: miles,
        laneStats: stats,
      });
      setRateSuggestion(suggestion);
    } catch {
      // Non-fatal
    } finally {
      setFetchingRate(false);
    }
  }, [form]);

  // Debounce rate suggestion fetch
  useEffect(() => {
    const timer = setTimeout(fetchRateSuggestion, 800);
    return () => clearTimeout(timer);
  }, [fetchRateSuggestion]);

  function applyTemplate(t: LoadTemplate) {
    setForm(t.template_data);
    setShowTemplates(false);
    setRateSuggestion(null);
  }

  async function handleSaveTemplate() {
    if (!templateName.trim() || !user?.id) return;
    setSavingTemplate(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('load_templates')
        .insert({
          user_id: user.id,
          company_id: company?.id ?? null,
          name: templateName.trim(),
          template_data: form,
        })
        .select()
        .single();
      if (data) setTemplates((prev) => [data as LoadTemplate, ...prev]);
      setTemplateName('');
      setShowSaveTemplate(false);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !company) {
      setError('Not authenticated');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const totalMiles = form.totalMiles ? parseInt(form.totalMiles) : null;
      const rateUsd = parseFloat(form.rateUsd);
      const ratePerMile = totalMiles && totalMiles > 0 ? +(rateUsd / totalMiles).toFixed(2) : null;

      await createLoad({
        load_number: genLoadNumber(),
        posted_by: user.id,
        company_id: company.id,
        company_name: company.name,
        origin_city: titleCase(form.originCity),
        origin_state: form.originState.trim().toUpperCase().slice(0, 2),
        origin_address: form.originAddress.trim() || null,
        origin_zip: form.originZip.trim() || null,
        dest_city: titleCase(form.destCity),
        dest_state: form.destState.trim().toUpperCase().slice(0, 2),
        dest_address: form.destAddress.trim() || null,
        dest_zip: form.destZip.trim() || null,
        pickup_date: form.pickupDate,
        delivery_date: form.deliveryDate,
        equipment: form.equipment,
        commodity: titleCase(form.commodity),
        weight_lbs: parseInt(form.weightLbs),
        rate_usd: rateUsd,
        rate_per_mile: ratePerMile,
        total_miles: totalMiles,
        status: 'posted',
        bid_count: 0,
        hazmat: form.hazmat,
        temp_controlled: form.tempControlled,
        posted_at: new Date().toISOString(),
        broker_credit_score: null,
        assigned_driver_id: null,
      });

      setForm(EMPTY_FORM);
      setRateSuggestion(null);
      setLaneStats(null);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post load');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full h-12 bg-[#111] border border-fx-border rounded-xl text-fx-text text-sm font-medium px-4 focus:border-fx-orange focus:ring-1 focus:ring-fx-orange/30 outline-none transition-all duration-200';

  return (
    <BottomSheet open={open} onClose={onClose} title="Post New Load">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Templates Bar */}
        {templates.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-fx-orange"
            >
              <Bookmark size={14} />
              Use Template
              <ChevronDown
                size={12}
                className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`}
              />
            </button>
            {showTemplates && (
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto rounded-xl border border-fx-border p-2 bg-fx-surface">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-fx-text hover:bg-fx-surface-2 transition-colors"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Origin */}
        <div>
          <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
            Origin
          </p>
          <div className="space-y-2">
            <Input
              placeholder="Street Address"
              value={form.originAddress}
              onChange={(e) => set('originAddress', e.target.value)}
            />
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-3">
                <Input
                  placeholder="City"
                  value={form.originCity}
                  onChange={(e) => set('originCity', e.target.value)}
                  required
                />
              </div>
              <Input
                placeholder="ST"
                maxLength={2}
                value={form.originState}
                onChange={(e) => set('originState', e.target.value)}
                required
              />
              <div className="col-span-2">
                <Input
                  placeholder="ZIP"
                  maxLength={10}
                  value={form.originZip}
                  onChange={(e) => set('originZip', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Destination */}
        <div>
          <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
            Destination
          </p>
          <div className="space-y-2">
            <Input
              placeholder="Street Address"
              value={form.destAddress}
              onChange={(e) => set('destAddress', e.target.value)}
            />
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-3">
                <Input
                  placeholder="City"
                  value={form.destCity}
                  onChange={(e) => set('destCity', e.target.value)}
                  required
                />
              </div>
              <Input
                placeholder="ST"
                maxLength={2}
                value={form.destState}
                onChange={(e) => set('destState', e.target.value)}
                required
              />
              <div className="col-span-2">
                <Input
                  placeholder="ZIP"
                  maxLength={10}
                  value={form.destZip}
                  onChange={(e) => set('destZip', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Pickup Date
            </p>
            <input
              type="date"
              value={form.pickupDate}
              onChange={(e) => set('pickupDate', e.target.value)}
              required
              className={fieldClass}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Delivery Date
            </p>
            <input
              type="date"
              value={form.deliveryDate}
              onChange={(e) => set('deliveryDate', e.target.value)}
              required
              className={fieldClass}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Equipment */}
        <div>
          <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
            Equipment
          </p>
          <select
            value={form.equipment}
            onChange={(e) => set('equipment', e.target.value as EquipmentType)}
            className={fieldClass}
            style={{ colorScheme: 'dark' }}
          >
            {EQUIPMENT_OPTIONS.map((eq) => (
              <option key={eq} value={eq} style={{ background: '#111' }}>
                {EQUIPMENT_LABELS[eq] ?? eq}
              </option>
            ))}
          </select>
        </div>

        {/* Commodity */}
        <div>
          <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
            Commodity
          </p>
          <Input
            placeholder="e.g. General Freight, Steel Coils"
            value={form.commodity}
            onChange={(e) => set('commodity', e.target.value)}
            required
          />
        </div>

        {/* Weight + Miles */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Weight (lbs)
            </p>
            <Input
              type="number"
              placeholder="42000"
              value={form.weightLbs}
              onChange={(e) => set('weightLbs', e.target.value)}
              required
            />
          </div>
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Total Miles
            </p>
            <Input
              type="number"
              placeholder="Optional"
              value={form.totalMiles}
              onChange={(e) => set('totalMiles', e.target.value)}
            />
          </div>
        </div>

        {/* Rate Intelligence Chip */}
        {(fetchingRate || rateSuggestion) && form.totalMiles && (
          <div
            className="rounded-xl p-3 flex items-start gap-3"
            style={{ background: 'rgba(232,96,48,0.08)', border: '1px solid rgba(232,96,48,0.2)' }}
          >
            <TrendingUp size={16} className="text-fx-orange shrink-0 mt-0.5" />
            {fetchingRate ? (
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="text-fx-orange animate-spin" />
                <span className="text-xs text-fx-text-muted">Fetching market data…</span>
              </div>
            ) : rateSuggestion ? (
              <div className="flex-1">
                <p className="text-[10px] font-bold text-fx-orange uppercase tracking-widest mb-1">
                  AI Rate Suggestion
                  {rateSuggestion.confidence === 'high' && (
                    <span className="ml-1 text-green-400">● High Confidence</span>
                  )}
                  {rateSuggestion.confidence === 'medium' && (
                    <span className="ml-1 text-yellow-400">● Medium</span>
                  )}
                  {rateSuggestion.confidence === 'low' && (
                    <span className="ml-1 text-fx-text-dim">● Low Data</span>
                  )}
                </p>
                <p className="text-sm font-bold text-fx-text">
                  ${rateSuggestion.suggested_low}/mi – ${rateSuggestion.suggested_mid}/mi – $
                  {rateSuggestion.suggested_high}/mi
                </p>
                <p className="text-[11px] text-fx-text-muted mt-1">{rateSuggestion.reasoning}</p>
                {laneStats && laneStats.sample_count > 0 && (
                  <p className="text-[10px] text-fx-text-dim mt-1">
                    Based on {laneStats.sample_count} transaction
                    {laneStats.sample_count !== 1 ? 's' : ''} · avg ${laneStats.avg_rate_per_mile}
                    /mi
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {(
                    [
                      rateSuggestion.suggested_low,
                      rateSuggestion.suggested_mid,
                      rateSuggestion.suggested_high,
                    ] as number[]
                  ).map((rpm, i) => {
                    const miles = parseInt(form.totalMiles);
                    const total = Math.round(rpm * miles);
                    const label = i === 0 ? 'Low' : i === 1 ? 'Mid' : 'High';
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => set('rateUsd', String(total))}
                        className="flex-1 text-[10px] font-bold rounded-lg py-1.5 transition-colors"
                        style={{
                          background: 'rgba(232,96,48,0.12)',
                          border: '1px solid rgba(232,96,48,0.25)',
                          color: '#E86030',
                        }}
                      >
                        {label} · ${total.toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Rate */}
        <div>
          <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
            Rate (USD)
          </p>
          <Input
            type="number"
            placeholder="3200"
            value={form.rateUsd}
            onChange={(e) => set('rateUsd', e.target.value)}
            required
          />
          {form.rateUsd && form.totalMiles && (
            <p className="text-xs text-fx-text-dim mt-1 pl-1">
              ≈ ${(parseFloat(form.rateUsd) / parseInt(form.totalMiles)).toFixed(2)}/mi
            </p>
          )}
        </div>

        {/* Special flags */}
        <div
          className="flex gap-6 rounded-xl p-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hazmat}
              onChange={(e) => set('hazmat', e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <span className="text-sm font-semibold text-fx-text-muted">HAZMAT</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.tempControlled}
              onChange={(e) => set('tempControlled', e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <span className="text-sm font-semibold text-fx-text-muted">Temp Controlled</span>
          </label>
        </div>

        {/* Save as Template */}
        <div>
          <button
            type="button"
            onClick={() => setShowSaveTemplate((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-fx-text-dim hover:text-fx-orange transition-colors"
          >
            <BookmarkPlus size={14} />
            Save as Template
          </button>
          {showSaveTemplate && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Template name…"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1 h-9 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-sm px-3 focus:border-fx-orange outline-none"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="px-3 h-9 rounded-lg text-xs font-bold bg-fx-orange text-white disabled:opacity-50"
              >
                {savingTemplate ? '…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
        )}

        <Button
          type="submit"
          disabled={saving}
          size="lg"
          fullWidth
          className="rounded-2xl font-bold"
          style={{
            background: 'linear-gradient(145deg, #F07040, #C03A12)',
            boxShadow: '0 4px 20px rgba(232,96,48,0.4)',
          }}
        >
          {saving ? 'Posting…' : 'Post Load'}
        </Button>
      </form>
    </BottomSheet>
  );
}
