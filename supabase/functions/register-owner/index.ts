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
    const { phone_number, pin, shop_name } = await req.json();

    // Validate phone format server-side
    const phoneRegex = /^\+8801[3-9][0-9]{8}$/;
    if (!phoneRegex.test(phone_number)) {
      return new Response(
        JSON.stringify({ error: 'অবৈধ ফোন নম্বর ফরম্যাট' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: 'PIN অবশ্যই ৬ সংখ্যার হতে হবে' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for duplicate phone number
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_number', phone_number)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'এই নম্বরটি আগে থেকেই নিবন্ধিত' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count existing profiles to determine if this is the first user
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const isFirstUser = count === 0;
    const role = isFirstUser ? 'super_admin' : 'owner';
    const status = isFirstUser ? 'active' : 'pending_approval';

    // Hash PIN
    const pin_hash = bcrypt.hashSync(pin);

    // Build profile data
    const profileData: Record<string, unknown> = {
      phone_number,
      pin_hash,
      role,
      status,
    };
    if (shop_name) profileData.shop_name = shop_name;
    if (isFirstUser) {
      const today = new Date().toISOString().split('T')[0];
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      profileData.last_paid_date = today;
      profileData.next_due_date = nextDue.toISOString().split('T')[0];
      profileData.subscription_status = 'active';
    }

    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Notify super_admins of new pending owner
    if (!isFirstUser) {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('expo_push_token')
        .eq('role', 'super_admin')
        .eq('status', 'active')
        .not('expo_push_token', 'is', null);

      if (admins && admins.length > 0) {
        const messages = admins
          .filter((a) => a.expo_push_token)
          .map((a) => ({
            to: a.expo_push_token,
            sound: 'default',
            title: 'নতুন নিবন্ধন অনুরোধ',
            body: `${phone_number} অনুমোদনের অপেক্ষায়`,
          }));

        if (messages.length > 0) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile_id: newProfile.id,
        role,
        status,
      }),
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
