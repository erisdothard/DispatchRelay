import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getTireIncidents } from '@/services/tire-incidents.service';
import { TireIncidentForm } from '@/features/driver/components/tire-incident-form';
import { TIRE_POSITION_LABELS } from '@/features/driver/components/tire-position-selector';
import type { TireIncident } from '@freightx/shared';

const SEVERITY_COLORS: Record<string, 'orange' | 'blue' | 'green' | 'gray'> = {
  flat: 'orange',
  blowout: 'orange',
  low_pressure: 'blue',
  damage: 'gray',
};

const SEVERITY_LABELS: Record<string, string> = {
  flat: 'Flat',
  blowout: 'Blowout',
  low_pressure: 'Low Pressure',
  damage: 'Damage',
};

export default function TireLogPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<TireIncident[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  function fetchIncidents() {
    if (!user?.id) return;
    setLoading(true);
    getTireIncidents(user.id)
      .then(setIncidents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchIncidents();
  }, [user?.id]);

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader greeting={false} name="Tire Log" />

      {/* Back button */}
      <div className="px-5 pb-3">
        <button
          onClick={() => navigate('/driver')}
          className="flex items-center gap-2 text-sm text-fx-text-dim hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-6 h-6 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-fx-orange/10 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-fx-orange" />
            </div>
            <p className="font-bold text-fx-text">No tire incidents logged</p>
            <p className="text-sm text-fx-text-muted mt-1">
              Tap the + button to log your first incident
            </p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-fx-surface border border-fx-border rounded-2xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={SEVERITY_COLORS[incident.severity] ?? 'gray'} size="sm">
                      {SEVERITY_LABELS[incident.severity] ?? incident.severity}
                    </Badge>
                    {incident.resolution && (
                      <Badge variant="green" size="sm">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {TIRE_POSITION_LABELS[incident.tirePosition]}
                  </p>
                </div>
                <p className="text-xs text-fx-text-dim">
                  {new Date(incident.incidentDate + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {incident.locationText && (
                <p className="text-xs text-fx-text-dim mb-1">{incident.locationText}</p>
              )}
              {incident.description && (
                <p className="text-xs text-fx-text-dim">{incident.description}</p>
              )}
              {incident.loadNumber && (
                <p className="text-xs text-fx-orange mt-1">Load: {incident.loadNumber}</p>
              )}

              {incident.photos.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {incident.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-fx-border"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-fx-orange flex items-center justify-center shadow-lg active-scale z-40"
        style={{ boxShadow: '0 6px 24px rgba(232,96,48,0.5)', maxWidth: 430 }}
      >
        <Plus size={24} className="text-white" />
      </button>

      <BottomNav role="driver" />

      <TireIncidentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={fetchIncidents}
      />
    </div>
  );
}
