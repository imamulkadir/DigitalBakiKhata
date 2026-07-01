import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

    const { claim_id, action } = await req.json();
    if (!claim_id || !['confirm', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'অবৈধ অনুরোধ' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: claim } = await supabaseAdmin
      .from('payment_claims')
      .select('owner_id')
      .eq('id', claim_id)
      .single();

    if (!claim) {
      return new Response(JSON.stringify({ error: 'পেমেন্ট ক্লেইম পাওয়া যায়নি' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claimUpdate =
      action === 'confirm'
        ? { status: 'confirmed', confirmed_by: userId, confirmed_at: new Date().toISOString() }
        : { status: 'rejected', confirmed_by: userId, confirmed_at: new Date().toISOString() };

    const { error: claimError } = await supabaseAdmin
      .from('payment_claims')
      .update(claimUpdate)
      .eq('id', claim_id);

    if (claimError) throw claimError;

    if (action === 'confirm') {
      const today = new Date().toISOString().split('T')[0];
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active',
          last_paid_date: today,
          next_due_date: nextDue.toISOString().split('T')[0],
        })
        .eq('id', claim.owner_id);

      if (profileError) throw profileError;

      // Notify owner
      const { data: ownerProfile } = await supabaseAdmin
        .from('profiles')
        .select('expo_push_token')
        .eq('id', claim.owner_id)
        .single();

      if (ownerProfile?.expo_push_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ownerProfile.expo_push_token,
            sound: 'default',
            title: 'পেমেন্ট নিশ্চিত',
            body: 'আপনার সাবস্ক্রিপশন সক্রিয় করা হয়েছে। ধন্যবাদ!',
          }),
        });
      }
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
