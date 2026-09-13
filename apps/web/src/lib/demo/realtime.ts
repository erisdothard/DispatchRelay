/**
 * Demo stand-in for a Supabase Realtime channel. `postgres_changes` bindings fire
 * whenever demo-db is written to, so live UI (bids, messages, tracking) still updates.
 */
import { onDemoChange, type DemoChange } from './demo-db';
import { realtimeFilterPredicate, type Predicate } from './query-engine';

interface Binding {
  event: string;
  table: string | null;
  filter: Predicate | null;
  callback: (payload: unknown) => void;
}

interface ChangesConfig {
  event?: string;
  table?: string;
  filter?: string;
}

export class DemoChannel {
  readonly topic: string;
  private readonly bindings: Binding[] = [];
  private detach: (() => void) | null = null;

  constructor(topic: string) {
    this.topic = topic;
  }

  on(type: string, config: ChangesConfig, callback: (payload: unknown) => void): this {
    if (type === 'postgres_changes') {
      this.bindings.push({
        event: config.event ?? '*',
        table: config.table ?? null,
        filter: config.filter ? realtimeFilterPredicate(config.filter) : null,
        callback,
      });
    }
    return this;
  }

  subscribe(onStatus?: (status: string, err?: Error) => void): this {
    if (!this.detach) this.detach = onDemoChange((change) => this.dispatch(change));
    if (onStatus) setTimeout(() => onStatus('SUBSCRIBED'), 0);
    return this;
  }

  async unsubscribe(): Promise<'ok'> {
    this.detach?.();
    this.detach = null;
    return 'ok';
  }

  async send(): Promise<'ok'> {
    return 'ok';
  }

  async track(): Promise<'ok'> {
    return 'ok';
  }

  async untrack(): Promise<'ok'> {
    return 'ok';
  }

  presenceState(): Record<string, unknown> {
    return {};
  }

  private dispatch(change: DemoChange): void {
    const row = change.eventType === 'DELETE' ? change.old : change.new;
    for (const binding of this.bindings) {
      if (binding.table && binding.table !== change.table) continue;
      if (binding.event !== '*' && binding.event !== change.eventType) continue;
      if (binding.filter && !binding.filter(row)) continue;
      binding.callback({
        schema: 'public',
        table: change.table,
        eventType: change.eventType,
        new: change.new,
        old: change.old,
        commit_timestamp: new Date().toISOString(),
        errors: null,
      });
    }
  }
}
