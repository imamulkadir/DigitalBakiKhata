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

    const { title, content } = await req.json();
    if (!title?.trim() || !content?.trim()) {
      return new Response(JSON.stringify({ error: 'শিরোনাম ও বিবরণ আবশ্যক' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: announcement, error: insertError } = await supabaseAdmin
      .from('announcements')
      .insert({ title: title.trim(), content: content.trim(), created_by: userId })
      .select()
      .single();

    if (insertError) throw insertError;

    const { data: owners } = await supabaseAdmin
      .from('profiles')
      .select('expo_push_token')
      .eq('role', 'owner')
      .eq('status', 'active')
      .not('expo_push_token', 'is', null);

    if (owners && owners.length > 0) {
      const messages = owners
        .filter((o) => o.expo_push_token)
        .map((o) => ({
          to: o.expo_push_token,
          sound: 'default',
          title: 'নতুন ঘোষণা',
          body: title.trim(),
        }));

      if (messages.length > 0) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messages),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, announcement }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'সার্ভার ত্রুটি হয়েছে' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
