// Falls back to harmless placeholders when unset so builds/prerendering
// never crash for lack of credentials — real requests will simply fail at
// runtime until real values are configured, instead of failing the build.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";
