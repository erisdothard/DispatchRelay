import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Root                                                              */
/* ------------------------------------------------------------------ */

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  TabsList                                                          */
/* ------------------------------------------------------------------ */

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Scroll horizontally when the triggers don't fit instead of squeezing them.
   * Needed on mobile where four labelled tabs overflow the viewport.
   */
  scrollable?: boolean;
}

export function TabsList({ children, className, scrollable = false }: TabsListProps) {
  const { value } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });

  // Fade whichever edge still has triggers behind it so the row reads as
  // scrollable rather than cut off.
  const syncOverflow = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    setOverflow({ start: list.scrollLeft > 1, end: list.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!scrollable || !list) return;

    syncOverflow();
    list.addEventListener('scroll', syncOverflow, { passive: true });

    const observer = new ResizeObserver(syncOverflow);
    observer.observe(list);

    return () => {
      list.removeEventListener('scroll', syncOverflow);
      observer.disconnect();
    };
  }, [scrollable, syncOverflow, children]);

  // Keep the active trigger in view — tapping a tab that's half off-screen, or
  // landing on one via deep link, should bring it fully into the scroll window.
  useEffect(() => {
    const list = listRef.current;
    if (!scrollable || !list) return;

    const active = list.querySelector<HTMLElement>('[data-state="active"]');
    if (!active) return;

    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    const pad = 12;

    if (left < list.scrollLeft) {
      list.scrollTo({ left: Math.max(0, left - pad), behavior: 'smooth' });
    } else if (right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: right - list.clientWidth + pad, behavior: 'smooth' });
    }
  }, [scrollable, value]);

  if (!scrollable) {
    return (
      <div
        role="tablist"
        className={cn('inline-flex items-center gap-1 rounded-xl p-1', className)}
      >
        {children}
      </div>
    );
  }

  return (
    // The pill sits on the outer wrapper so only the triggers scroll inside it.
    <div className={cn('rounded-xl p-1', className)}>
      <div
        ref={listRef}
        role="tablist"
        className={cn(
          'flex items-center gap-1 overflow-x-auto scrollbar-hide',
          overflow.start && overflow.end && 'fade-edge-both',
          overflow.start && !overflow.end && 'fade-edge-start',
          !overflow.start && overflow.end && 'fade-edge-end',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TabsTrigger                                                       */
/* ------------------------------------------------------------------ */

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className, disabled = false }: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5',
        'text-sm font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/40',
        isActive ? 'bg-fx-surface text-fx-text shadow-sm' : 'text-fx-text-muted hover:text-fx-text',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TabsContent                                                       */
/* ------------------------------------------------------------------ */

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return (
    <div role="tabpanel" data-state="active" className={className}>
      {children}
    </div>
  );
}
