import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { signSessionToken } from '../_shared/jwt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone_number, pin } = await req.json();

    if (!phone_number || !pin) {
      return new Response(
        JSON.stringify({ error: 'ফোন নম্বর ও PIN আবশ্যক' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (fetchError || !profile) {
      return new Response(
        JSON.stringify({ error: 'ফোন নম্বর বা PIN ভুল' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.status === 'pending_approval') {
      return new Response(
        JSON.stringify({ error: 'আপনার অ্যাকাউন্ট এখনও অনুমোদিত হয়নি', status: 'pending_approval' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (profile.status === 'rejected') {
      return new Response(
        JSON.stringify({ error: 'আপনার অ্যাকাউন্ট প্রত্যাখ্যাত হয়েছে', status: 'rejected' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (profile.status === 'suspended') {
      return new Response(
        JSON.stringify({ error: 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে', status: 'suspended' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.pin_reset_required) {
      return new Response(
        JSON.stringify({ error: 'আপনার PIN রিসেট করা হয়েছে, নতুন PIN সেট করুন', status: 'pin_reset_required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
      return new Response(
        JSON.stringify({ error: 'অনেকবার ভুল PIN দেওয়া হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন', status: 'locked' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pinValid = bcrypt.compareSync(pin, profile.pin_hash);
    if (!pinValid) {
      const attempts = (profile.failed_pin_attempts ?? 0) + 1;
      if (attempts >= MAX_PIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
        await supabaseAdmin
          .from('profiles')
          .update({ failed_pin_attempts: 0, pin_locked_until: lockedUntil })
          .eq('id', profile.id);
        return new Response(
          JSON.stringify({ error: 'অনেকবার ভুল PIN দেওয়া হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন', status: 'locked' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      await supabaseAdmin.from('profiles').update({ failed_pin_attempts: attempts }).eq('id', profile.id);
      return new Response(
        JSON.stringify({ error: 'ফোন নম্বর বা PIN ভুল' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.failed_pin_attempts > 0 || profile.pin_locked_until) {
      await supabaseAdmin
        .from('profiles')
        .update({ failed_pin_attempts: 0, pin_locked_until: null })
        .eq('id', profile.id);
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await signSessionToken({
      sub: profile.id,
      iss: 'supabase',
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days
      role: 'authenticated',
    });

    return new Response(
      JSON.stringify({
        access_token: token,
        token_type: 'bearer',
        profile: {
          id: profile.id,
          phone_number: profile.phone_number,
          role: profile.role,
          status: profile.status,
          shop_name: profile.shop_name,
          owner_name: profile.owner_name,
          owner_photo_url: profile.owner_photo_url,
          subscription_status: profile.subscription_status,
          created_at: profile.created_at,
          last_paid_date: profile.last_paid_date,
          next_due_date: profile.next_due_date,
          expo_push_token: profile.expo_push_token,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'সার্ভার ত্রুটি হয়েছে' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
