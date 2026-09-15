import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { getSyncStatus, processQueue } from '@/services/offline-sync.service';

export function SyncIndicator() {
  const [status, setStatus] = useState({ pending: 0, failed: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  // Poll sync status
  useEffect(() => {
    const check = () => setStatus(getSyncStatus());
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      handleSync();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  async function handleSync() {
    if (syncing || status.pending === 0) return;
    setSyncing(true);
    try {
      await processQueue();
      setStatus(getSyncStatus());
    } finally {
      setSyncing(false);
    }
  }

  // Nothing to show if online and no pending items
  if (online && status.total === 0) return null;

  return (
    <button
      onClick={handleSync}
      disabled={syncing || !online || status.pending === 0}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
        !online
          ? 'bg-fx-danger-dim border-transparent text-fx-danger'
          : status.failed > 0
            ? 'bg-fx-danger-dim border-transparent text-fx-danger'
            : syncing
              ? 'bg-fx-surface-2 border-fx-border-2 text-fx-text'
              : 'bg-fx-surface border-fx-border text-fx-text-muted'
      }`}
    >
      {!online ? (
        <>
          <CloudOff size={10} />
          Offline ({status.pending})
        </>
      ) : syncing ? (
        <>
          <Loader2 size={10} className="animate-spin" />
          Syncing...
        </>
      ) : status.failed > 0 ? (
        <>
          <CloudOff size={10} />
          {status.failed} failed
        </>
      ) : status.pending > 0 ? (
        <>
          <Cloud size={10} />
          {status.pending} pending
        </>
      ) : null}
    </button>
  );
}
