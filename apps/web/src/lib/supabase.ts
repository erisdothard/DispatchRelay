import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { createDemoClient } from './demo/demo-client';
import { IS_DEMO_ENV } from './demo/demo-env';
import { isDemoActive } from './demo/demo-session';

type AppSupabaseClient = SupabaseClient<Database>;

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!IS_DEMO_ENV && !key) {
  console.error('CRITICAL: VITE_SUPABASE_URL is set but VITE_SUPABASE_ANON_KEY is missing.');
}

/** Real backend — never created in demo builds, so they make no network calls at all. */
const realClient: AppSupabaseClient | null =
  IS_DEMO_ENV || !url
    ? null
    : createClient<Database>(url, key || 'placeholder', {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });

const demoClient = createDemoClient() as unknown as AppSupabaseClient;

/**
 * App-wide Supabase client. Routes to the in-memory demo backend whenever demo mode is
 * active — no backend configured, or a demo role was picked on the login screen.
 */
export const supabase: AppSupabaseClient = new Proxy({} as AppSupabaseClient, {
  get(_target, prop) {
    const client = realClient && !isDemoActive() ? realClient : demoClient;
    const value: unknown = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
