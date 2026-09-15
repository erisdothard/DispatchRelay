import { DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { InvoiceRow, InvoiceStatus } from '@/lib/database.types';
import { approveInvoice, selectPaymentMethod } from '@/services/stripe.service';
import { useState } from 'react';

interface Props {
  invoice: InvoiceRow;
  userRole: 'broker' | 'carrier' | 'admin';
  onUpdate?: (updated: InvoiceRow) => void;
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  pending: {
    label: 'Pending',
    className: 'text-fx-text-muted bg-fx-surface-2 border-fx-border',
    icon: Clock,
  },
  invoiced: {
    label: 'Invoiced',
    className: 'text-fx-text-muted bg-fx-surface-2 border-fx-border',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className: 'text-fx-text bg-fx-surface-2 border-fx-border-2',
    icon: CheckCircle2,
  },
  paid: {
    label: 'Paid',
    className: 'text-fx-success bg-fx-success-dim border-transparent',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'text-fx-text-dim bg-fx-surface-2 border-fx-border',
    icon: AlertCircle,
  },
};

function fmtUsd(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function InvoiceCard({ invoice, userRole, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPayOptions, setShowPayOptions] = useState(false);

  const { label, className, icon: Icon } = STATUS_CONFIG[invoice.status];

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    setErr(null);
    try {
      await fn();
      // refetch would be ideal — for now signal parent
      onUpdate?.({ ...invoice });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-fx-surface border border-fx-border rounded-xl p-4 space-y-3">
      {/* Row 1: amount + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-fx-orange" />
          <span className="text-lg font-bold text-fx-text">{fmtUsd(invoice.amount_usd)}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${className}`}
        >
          <Icon size={11} />
          {label}
        </span>
      </div>

      {/* Row 2: meta */}
      <div className="flex items-center gap-4 text-xs text-fx-text-dim">
        {invoice.due_date && <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>}
        {invoice.payment_method && (
          <span className="capitalize">{invoice.payment_method.replace('_', ' ')}</span>
        )}
        {invoice.quick_pay_fee_usd && (
          <span className="text-fx-text-muted">
            Quick Pay fee: {fmtUsd(invoice.quick_pay_fee_usd)}
          </span>
        )}
      </div>

      {/* Broker: approve invoice */}
      {userRole === 'broker' && invoice.status === 'invoiced' && (
        <button
          onClick={() => handle(() => approveInvoice(invoice.id))}
          disabled={loading}
          className="h-9 w-full bg-fx-orange hover:bg-fx-orange/90 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Processing…' : 'Approve Invoice'}
        </button>
      )}

      {/* Carrier: choose payment method */}
      {userRole === 'carrier' && invoice.status === 'approved' && !showPayOptions && (
        <button
          onClick={() => setShowPayOptions(true)}
          className="h-9 w-full bg-fx-orange hover:bg-fx-orange/90 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Select Payment Method
        </button>
      )}

      {showPayOptions && invoice.status === 'approved' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              handle(() =>
                selectPaymentMethod(invoice.id, 'standard_net30').then(() =>
                  setShowPayOptions(false),
                ),
              )
            }
            disabled={loading}
            className="h-10 flex flex-col items-center justify-center bg-fx-surface-2 hover:bg-fx-surface-3 disabled:opacity-40 border border-fx-border-2 rounded-lg transition-colors"
          >
            <span className="text-xs font-semibold text-fx-text">Net 30</span>
            <span className="text-[10px] text-fx-text-dim">No fee</span>
          </button>
          <button
            onClick={() =>
              handle(() =>
                selectPaymentMethod(invoice.id, 'quick_pay').then(() => setShowPayOptions(false)),
              )
            }
            disabled={loading}
            className="h-10 flex flex-col items-center justify-center bg-fx-orange/10 hover:bg-fx-orange/20 disabled:opacity-40 border border-fx-orange/30 rounded-lg transition-colors"
          >
            <span className="text-xs font-semibold text-fx-orange">Quick Pay</span>
            <span className="text-[10px] text-fx-text-dim">2% fee · 2 days</span>
          </button>
        </div>
      )}

      {err && (
        <p className="text-xs text-fx-danger flex items-center gap-1">
          <AlertCircle size={11} /> {err}
        </p>
      )}
    </div>
  );
}
