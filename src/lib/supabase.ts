import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Auth is handled by our own edge functions (login/register-owner), which mint
// a JWT for a profiles row rather than a real auth.users row. Supabase's
// built-in auth.setSession() calls GoTrue's /auth/v1/user to validate the
// session against auth.users, which fails for this token and silently leaves
// the client on the anon key. The `accessToken` option skips that GoTrue
// session machinery entirely and just uses whatever token we hand it for
// every request's Authorization header.
let currentToken: string | null = null;

export function setSupabaseToken(token: string | null): void {
  currentToken = token;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => currentToken,
});
