import { useRef, useState, useEffect } from 'react';
import { Loader2, RotateCcw, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { markBolSigned, notifyBolSignedParties } from '@/services/documents.service';

interface BolSignatureSheetProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  loadId: string;
  loadNumber: string;
  origin: string;
  dest: string;
  onSigned: (signatureUrl: string) => void;
}

/**
 * Loader/dock-worker BOL signature capture.
 * Driver hands phone to the loader at pickup — they sign on the canvas.
 */
export function BolSignatureSheet({
  open,
  onClose,
  documentId,
  loadId,
  loadNumber,
  origin,
  dest,
  onSigned,
}: BolSignatureSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatoryName, setSignatoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setHasSignature(false);
    setError('');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [open]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#E86030';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSign() {
    if (!hasSignature || !signatoryName.trim()) return;
    const canvas = canvasRef.current!;
    setSaving(true);
    setError('');

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas empty'))),
          'image/png',
          0.95,
        );
      });

      // Upload signature PNG
      const path = `documents/signatures/bol-${loadId}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      const signatureUrl = urlData.publicUrl;

      // Mark document as signed
      await markBolSigned({
        documentId,
        signatoryName: signatoryName.trim(),
        signatureUrl,
      });

      // Notify broker + carrier (non-blocking)
      notifyBolSignedParties({
        loadId,
        loadNumber,
        origin,
        dest,
        signerName: signatoryName.trim(),
      }).catch(console.warn);

      onSigned(signatureUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save signature');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-3xl p-6 space-y-4"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div>
          <h2 className="text-lg font-bold text-fx-text">Loader Signature — Bill of Lading</h2>
          <p className="text-sm text-fx-text-muted mt-0.5">
            Load {loadNumber} · {origin} → {dest}
          </p>
          <p className="text-xs text-fx-text-dim mt-1">Have the loader/dock worker sign below</p>
        </div>

        {/* Signature pad */}
        <div
          className="rounded-xl overflow-hidden border border-fx-border"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full"
            style={{ display: 'block', cursor: 'crosshair', background: '#111' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-[11px] text-fx-text-dim">Draw your signature above</p>
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 text-xs text-fx-text-dim hover:text-fx-orange transition-colors"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        </div>

        {/* Printed name */}
        <div>
          <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
            Loader Name
          </p>
          <input
            type="text"
            placeholder="Loader's full name"
            value={signatoryName}
            onChange={(e) => setSignatoryName(e.target.value)}
            className="w-full h-10 bg-fx-surface-2 border border-fx-border rounded-xl text-fx-text text-sm px-3 focus:border-fx-orange outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl font-bold text-sm bg-fx-surface-2 text-fx-text-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!hasSignature || !signatoryName.trim() || saving}
            className="flex-1 h-12 rounded-2xl font-bold text-sm bg-fx-orange text-white disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Check size={16} /> Confirm Signature
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
