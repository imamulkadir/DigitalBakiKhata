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

    // Verify the caller is super_admin via their JWT
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

    const { owner_id, action } = await req.json();
    if (!owner_id || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'অবৈধ অনুরোধ' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30);

    const updateData =
      action === 'approve'
        ? {
            status: 'active',
            approved_at: new Date().toISOString(),
            approved_by: userId,
            subscription_status: 'active',
            last_paid_date: today,
            next_due_date: nextDue.toISOString().split('T')[0],
          }
        : { status: 'rejected' };

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', owner_id);

    if (updateError) throw updateError;

    // Send push notification to the owner
    if (action === 'approve') {
      const { data: ownerProfile } = await supabaseAdmin
        .from('profiles')
        .select('expo_push_token')
        .eq('id', owner_id)
        .single();

      if (ownerProfile?.expo_push_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ownerProfile.expo_push_token,
            sound: 'default',
            title: 'অ্যাকাউন্ট অনুমোদিত',
            body: 'আপনার অ্যাকাউন্ট অনুমোদিত হয়েছে, এখন লগইন করুন',
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
