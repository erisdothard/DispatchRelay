/**
 * An in-memory Supabase client for demo mode: tables, rpc, edge functions, storage,
 * auth and realtime are all served locally — no network requests.
 */
import { createDemoAuth } from './auth';
import { demoDb } from './demo-db';
import { currentDemoIdentity } from './demo-session';
import { FUNCTION_HANDLERS, RPC_HANDLERS } from './domains';
import { DemoQueryBuilder, DemoRpcCall } from './query-builder';
import { DemoChannel } from './realtime';
import { startDemoSimulator } from './simulator';
import { createDemoStorage } from './storage';
import type { DemoHandler, Row } from './types';

function toArgs(value: unknown): Row {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Row;
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' ? (value as Row) : {};
}

async function runHandler(handler: DemoHandler, args: Row): Promise<unknown> {
  return handler(args, { identity: currentDemoIdentity(), db: demoDb });
}

export function createDemoClient() {
  const client = {
    from: (table: string) => {
      // Start live truck movement the first time the demo backend is actually used,
      // so real-backend builds never run it.
      startDemoSimulator();
      return new DemoQueryBuilder(table);
    },
    schema: () => client,
    rpc: (fn: string, args?: Row) => {
      const handler = RPC_HANDLERS[fn];
      // Unmodelled functions resolve to null — most are fire-and-forget side effects.
      return new DemoRpcCall(() =>
        handler ? runHandler(handler, args ?? {}) : Promise.resolve(null),
      );
    },
    functions: {
      async invoke(name: string, options?: { body?: unknown }) {
        const handler = FUNCTION_HANDLERS[name];
        if (!handler) {
          return {
            data: null,
            error: { name: 'FunctionsError', message: `${name} isn't available in the demo.` },
          };
        }
        try {
          return { data: await runHandler(handler, toArgs(options?.body)), error: null };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { data: null, error: { name: 'FunctionsError', message } };
        }
      },
    },
    storage: createDemoStorage(),
    auth: createDemoAuth(),
    channel: (topic: string) => new DemoChannel(topic),
    removeChannel: async (channel: DemoChannel) => channel.unsubscribe(),
    removeAllChannels: async () => [],
    getChannels: () => [],
  };
  return client;
}
