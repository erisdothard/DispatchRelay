/**
 * True when the build has no Supabase backend configured (or demo mode is forced),
 * in which case the app runs entirely on the in-memory demo backend.
 */
export const IS_DEMO_ENV: boolean =
  import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL;
