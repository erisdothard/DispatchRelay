import { Wifi, Battery, Signal } from 'lucide-react';

export function IOSStatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 select-none">
      <span className="text-[13px] font-semibold text-white tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={14} className="text-white" strokeWidth={2} />
        <Wifi size={14} className="text-white" strokeWidth={2} />
        <Battery size={14} className="text-white" strokeWidth={2} />
      </div>
    </div>
  );
}
