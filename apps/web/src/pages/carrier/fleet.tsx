import { useState } from 'react';
import { Plus, Truck, MapPin, Calendar, Pencil, Trash2, WifiOff } from 'lucide-react';
import { FleetMap } from '@/shared/components/fleet-map';
import type { TruckPin } from '@/shared/components/fleet-map';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { PostTruckSheet } from '@/features/trucks/components/post-truck-sheet';
import { useTrucks } from '@/features/trucks/hooks/use-trucks';
import { useAuth } from '@/contexts/AuthContext';
import { deleteTruck } from '@/services/trucks.service';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Truck as TruckType } from '@freightx/shared';

export default function CarrierFleetPage() {
  const { user } = useAuth();
  const [showPost, setShowPost] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { trucks, loading, error, refresh } = useTrucks(user ? { postedBy: user.id } : {});

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 4000);
      return;
    }
    setDeleting(true);
    try {
      await deleteTruck(id);
      refresh();
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="My Fleet" showBack />

      {/* Summary */}
      <div className="px-5 py-4">
        <div className="bg-fx-surface border border-fx-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-fx-text-muted font-semibold uppercase tracking-widest">
              Posted Trucks
            </p>
            <p className="text-3xl font-extrabold text-fx-orange mt-1">
              {loading ? '—' : trucks.length}
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center">
            <Truck size={28} className="text-fx-orange" />
          </div>
        </div>
      </div>

      {/* Fleet map — shows origin pins for all posted trucks */}
      {!loading && trucks.length > 0 && (
        <div className="px-5 pb-4">
          <FleetMap
            trucks={trucks.map(
              (t): TruckPin => ({
                id: t.id,
                city: t.originCity,
                state: t.originState,
                equipment: t.equipment,
                status: t.status,
              }),
            )}
          />
        </div>
      )}

      {/* Truck list */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-fx-border border-t-fx-orange rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <WifiOff size={36} className="text-fx-text-dim mb-4" />
            <p className="font-bold text-fx-text">Couldn't load your fleet</p>
            <p className="text-sm text-fx-text-muted mt-1 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm font-semibold text-fx-orange border border-fx-orange/30 px-5 py-2 rounded-xl hover:bg-fx-orange/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : trucks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🚛</div>
            <p className="font-bold text-fx-text">No trucks posted</p>
            <p className="text-sm text-fx-text-muted mt-1">
              Post your first truck to get matched with loads
            </p>
          </div>
        ) : (
          trucks.map((truck) => (
            <div key={truck.id} className="bg-fx-surface border border-fx-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge
                    variant={
                      truck.status === 'available'
                        ? 'green'
                        : truck.status === 'booked'
                          ? 'orange'
                          : 'gray'
                    }
                  >
                    {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                  </Badge>
                  <p className="text-base font-bold text-fx-text mt-1.5">
                    {EQUIPMENT_LABELS[truck.equipment] ?? truck.equipment}
                    {truck.lengthFt && ` · ${truck.lengthFt}ft`}
                  </p>
                </div>
                <div className="text-2xl">🚛</div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-fx-orange" />
                  <span className="text-sm text-fx-text-muted font-medium">
                    {truck.originCity}, {truck.originState}
                    {truck.destCity && ` → ${truck.destCity}, ${truck.destState}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-fx-text-dim" />
                  <span className="text-sm text-fx-text-muted font-medium">
                    Available{' '}
                    {new Date(truck.availableDate + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {truck.driverName && (
                <div className="mt-3 pt-3 border-t border-fx-border flex items-center justify-between">
                  <span className="text-xs text-fx-text-muted font-medium">
                    Driver: {truck.driverName}
                  </span>
                  <span className="text-xs text-fx-text-dim">{truck.driverPhone}</span>
                </div>
              )}

              {/* Edit / Delete actions */}
              <div className="mt-3 pt-3 border-t border-fx-border flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingTruck(truck);
                    setShowPost(true);
                  }}
                  className="flex-1 h-9 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center gap-1.5 text-xs font-semibold text-fx-text-muted hover:border-fx-orange/40 hover:text-fx-orange transition-colors"
                >
                  <Pencil size={13} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(truck.id)}
                  disabled={deleting && confirmDeleteId === truck.id}
                  className={`flex-1 h-9 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                    confirmDeleteId === truck.id
                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                      : 'bg-fx-surface-2 border-fx-border text-fx-text-muted hover:border-red-500/30 hover:text-red-400'
                  }`}
                >
                  <Trash2 size={13} />
                  {confirmDeleteId === truck.id ? 'Confirm?' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <div className="px-5 py-4">
        <Button
          size="lg"
          fullWidth
          className="rounded-2xl font-bold"
          onClick={() => {
            setEditingTruck(null);
            setShowPost(true);
          }}
        >
          <Plus size={18} />
          Post New Truck
        </Button>
      </div>

      <BottomNav role="carrier" />

      <PostTruckSheet
        open={showPost}
        onClose={() => {
          setShowPost(false);
          setEditingTruck(null);
        }}
        onCreated={refresh}
        truck={editingTruck ?? undefined}
      />
    </div>
  );
}
