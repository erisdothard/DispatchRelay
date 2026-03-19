import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  PenLine,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverLoads } from '@/services/loads.service';
import { getDocumentsForLoad, uploadDocument } from '@/services/documents.service';
import { BolSignatureSheet } from '@/features/documents/components/bol-signature-sheet';
import type { Load } from '@freightx/shared';
import type { DocumentRow, DocumentType } from '@/lib/database.types';

interface LoadWithDocs {
  load: Load;
  docs: DocumentRow[];
}

function docLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    bill_of_lading: 'BOL',
    proof_of_delivery: 'POD',
    rate_confirmation: 'Rate Con',
    other: 'Doc',
  };
  return labels[type] ?? type;
}

function docStatusBadge(doc: DocumentRow): { label: string; variant: 'orange' | 'green' | 'blue' } {
  if (doc.type === 'bill_of_lading' && doc.signed_at) {
    return { label: 'Signed', variant: 'green' };
  }
  if (doc.type === 'bill_of_lading') {
    return { label: 'Pending Signature', variant: 'orange' };
  }
  return { label: 'Uploaded', variant: 'blue' };
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DriverDocumentsPage() {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [loadDocs, setLoadDocs] = useState<LoadWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // loadId being uploaded to
  const [uploadType, setUploadType] = useState<DocumentType>('proof_of_delivery');
  const [justUploaded, setJustUploaded] = useState<string | null>(null);

  // BOL signing state
  const [signingDoc, setSigningDoc] = useState<{
    doc: DocumentRow;
    load: Load;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const activeLoadIdRef = useRef<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const loads = await getDriverLoads(user.id);
      // Sort: active loads first
      const priority: Record<string, number> = {
        in_transit: 0,
        dispatched: 1,
        awarded: 2,
        delivered: 3,
        completed: 4,
      };
      const sorted = [...loads].sort(
        (a, b) => (priority[a.status] ?? 5) - (priority[b.status] ?? 5),
      );

      const results: LoadWithDocs[] = await Promise.all(
        sorted.map(async (load) => {
          const docs = await getDocumentsForLoad(load.id).catch(() => [] as DocumentRow[]);
          return { load, docs };
        }),
      );
      setLoadDocs(results);
    } catch (e) {
      console.error('Failed to fetch documents', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleFile(file: File | null) {
    const loadId = activeLoadIdRef.current;
    if (!file || !user || !loadId) return;
    setUploading(loadId);
    try {
      await uploadDocument({
        loadId,
        uploadedBy: user.id,
        companyId: company?.id ?? null,
        type: uploadType,
        file,
      });
      setJustUploaded(loadId);
      setTimeout(() => setJustUploaded(null), 2500);
      fetchAll();
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }

  function startUpload(loadId: string, type: DocumentType, useCamera: boolean) {
    activeLoadIdRef.current = loadId;
    setUploadType(type);
    if (useCamera) {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  }

  const statusBadge: Record<string, 'orange' | 'blue' | 'green' | 'gray'> = {
    in_transit: 'orange',
    dispatched: 'blue',
    awarded: 'blue',
    delivered: 'green',
  };

  const statusLabel: Record<string, string> = {
    in_transit: 'In Transit',
    dispatched: 'Dispatched',
    awarded: 'Awarded',
    delivered: 'Delivered',
    completed: 'Completed',
  };

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="Documents" showBack backAction={() => navigate('/driver')} />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
          </div>
        ) : loadDocs.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="text-fx-text-dim mx-auto mb-3" />
            <p className="text-sm text-fx-text-muted">No loads assigned yet</p>
          </div>
        ) : (
          loadDocs.map(({ load, docs }) => {
            const hasBol = docs.some((d) => d.type === 'bill_of_lading');
            const hasPod = docs.some((d) => d.type === 'proof_of_delivery');
            const isActive = ['in_transit', 'dispatched', 'awarded'].includes(load.status);

            return (
              <div
                key={load.id}
                className="bg-fx-surface border border-fx-border rounded-2xl overflow-hidden"
              >
                {/* Load header */}
                <div className="p-4 border-b border-fx-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-fx-orange">{load.loadNumber}</span>
                    <Badge variant={statusBadge[load.status] ?? 'gray'} size="sm">
                      {statusLabel[load.status] ?? load.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-fx-text">
                    {load.originCity}, {load.originState} → {load.destCity}, {load.destState}
                  </p>
                  {(load.originAddress || load.destAddress) && (
                    <p className="text-[11px] text-fx-text-dim mt-0.5">
                      {load.originAddress && (
                        <span>{load.originAddress}{load.originZip ? ` ${load.originZip}` : ''}</span>
                      )}
                      {load.originAddress && load.destAddress && ' → '}
                      {load.destAddress && (
                        <span>{load.destAddress}{load.destZip ? ` ${load.destZip}` : ''}</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Documents list */}
                <div className="divide-y divide-fx-border">
                  {docs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-fx-text-dim">
                      No documents yet
                    </div>
                  ) : (
                    docs.map((doc) => {
                      const status = docStatusBadge(doc);
                      const isBolUnsigned =
                        doc.type === 'bill_of_lading' && !doc.signed_at;

                      return (
                        <div
                          key={doc.id}
                          className="p-3 flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-fx-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-fx-text truncate">
                                {doc.file_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold text-fx-orange">
                                {docLabel(doc.type)}
                              </span>
                              <Badge variant={status.variant} size="sm">
                                {status.label}
                              </Badge>
                              {doc.file_size_bytes && (
                                <span className="text-[10px] text-fx-text-dim">
                                  {formatBytes(doc.file_size_bytes)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {isBolUnsigned && isActive ? (
                            <button
                              onClick={() => setSigningDoc({ doc, load })}
                              className="h-8 px-3 rounded-xl bg-fx-orange text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0"
                            >
                              <PenLine size={12} /> Sign
                            </button>
                          ) : (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-fx-text-dim hover:text-fx-orange transition-colors shrink-0"
                            >
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Upload actions */}
                {isActive && (
                  <div className="p-3 border-t border-fx-border flex gap-2">
                    {!hasBol && (
                      <button
                        onClick={() => startUpload(load.id, 'bill_of_lading', false)}
                        disabled={uploading === load.id}
                        className="flex-1 h-9 rounded-xl border border-dashed border-fx-orange/40 text-[11px] font-semibold text-fx-orange flex items-center justify-center gap-1.5 hover:bg-fx-orange/5 transition-colors disabled:opacity-50"
                      >
                        {uploading === load.id && justUploaded !== load.id ? (
                          <span className="w-3 h-3 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
                        ) : justUploaded === load.id ? (
                          <>
                            <CheckCircle2 size={12} className="text-green-400" />
                            <span className="text-green-400">Done!</span>
                          </>
                        ) : (
                          <>
                            <Upload size={12} /> Upload BOL
                          </>
                        )}
                      </button>
                    )}
                    {!hasPod && (
                      <>
                        <button
                          onClick={() => startUpload(load.id, 'proof_of_delivery', false)}
                          disabled={uploading === load.id}
                          className="flex-1 h-9 rounded-xl border border-dashed border-fx-orange/40 text-[11px] font-semibold text-fx-orange flex items-center justify-center gap-1.5 hover:bg-fx-orange/5 transition-colors disabled:opacity-50"
                        >
                          <Upload size={12} /> Upload POD
                        </button>
                        <button
                          onClick={() => startUpload(load.id, 'proof_of_delivery', true)}
                          disabled={uploading === load.id}
                          className="w-9 h-9 rounded-xl border border-dashed border-fx-orange/40 text-fx-orange flex items-center justify-center hover:bg-fx-orange/5 transition-colors disabled:opacity-50 shrink-0"
                          title="Capture POD with camera"
                        >
                          <Camera size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {/* BOL Signing Sheet */}
      {signingDoc && (
        <BolSignatureSheet
          open={true}
          onClose={() => setSigningDoc(null)}
          documentId={signingDoc.doc.id}
          loadId={signingDoc.load.id}
          loadNumber={signingDoc.load.loadNumber}
          origin={`${signingDoc.load.originCity}, ${signingDoc.load.originState}`}
          dest={`${signingDoc.load.destCity}, ${signingDoc.load.destState}`}
          onSigned={() => {
            setSigningDoc(null);
            fetchAll();
          }}
        />
      )}

      <BottomNav role="driver" />
    </div>
  );
}
