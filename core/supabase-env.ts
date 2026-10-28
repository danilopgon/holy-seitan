/** biome-ignore-all lint/style/noNonNullAssertion: Conexión a Supabase */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// The legacy anon key stops working at the end of 2026: prefer the publishable key (sb_publishable_…).
// The anon fallback only covers the switch-over while both are configured.
export const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
