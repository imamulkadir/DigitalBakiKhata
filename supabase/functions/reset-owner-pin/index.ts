import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { verifySessionToken } from '../_shared/jwt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'অনুমতি নেই' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const payload = await verifySessionToken(token);
      userId = payload.sub as string;
    } catch {
      return new Response(JSON.stringify({ error: 'অবৈধ সেশন' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!adminProfile || adminProfile.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'শুধুমাত্র সুপার অ্যাডমিন এই কাজ করতে পারবেন' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { owner_id } = await req.json();
    if (!owner_id) {
      return new Response(JSON.stringify({ error: 'অবৈধ অনুরোধ' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Invalidate the old PIN with an unguessable random hash and flag the
    // account so `login` short-circuits straight to the set-new-pin flow
    // regardless of whatever PIN is typed in.
    const lockoutHash = bcrypt.hashSync(crypto.randomUUID());

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        pin_hash: lockoutHash,
        pin_reset_required: true,
        failed_pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq('id', owner_id)
      .eq('role', 'owner')
      .select('expo_push_token')
      .single();

    if (updateError || !updated) {
      return new Response(JSON.stringify({ error: 'দোকানদার পাওয়া যায়নি' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (updated.expo_push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: updated.expo_push_token,
          sound: 'default',
          title: 'PIN রিসেট হয়েছে',
          body: 'আপনার PIN রিসেট করা হয়েছে। লগইন করে নতুন PIN সেট করুন।',
        }),
      });
    }

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
