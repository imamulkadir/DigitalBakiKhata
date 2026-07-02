import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone_number, new_pin } = await req.json();

    if (!new_pin || new_pin.length !== 6 || !/^\d{6}$/.test(new_pin)) {
      return new Response(
        JSON.stringify({ error: 'PIN অবশ্যই ৬ সংখ্যার হতে হবে' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, pin_reset_required')
      .eq('phone_number', phone_number)
      .single();

    // Only usable while an admin has explicitly flagged this account for
    // reset — closes the window the moment a new PIN is set.
    if (!profile || !profile.pin_reset_required) {
      return new Response(
        JSON.stringify({ error: 'কোনো PIN রিসেট অনুরোধ পাওয়া যায়নি' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pin_hash = bcrypt.hashSync(new_pin);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ pin_hash, pin_reset_required: false, failed_pin_attempts: 0, pin_locked_until: null })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true }),
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
