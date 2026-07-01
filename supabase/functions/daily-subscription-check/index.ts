import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysDate = threeDaysFromNow.toISOString().split('T')[0];

    // Set due_soon for active owners whose next_due_date is within 3 days
    const { data: dueSoonOwners } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'due_soon' })
      .eq('role', 'owner')
      .eq('subscription_status', 'active')
      .lte('next_due_date', threeDaysDate)
      .gte('next_due_date', today)
      .select('expo_push_token');

    // Set overdue for owners whose next_due_date has passed
    const { data: overdueOwners } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'overdue' })
      .eq('role', 'owner')
      .in('subscription_status', ['active', 'due_soon'])
      .lt('next_due_date', today)
      .select('expo_push_token');

    // Send reminder notifications to due_soon owners
    if (dueSoonOwners && dueSoonOwners.length > 0) {
      const messages = dueSoonOwners
        .filter((o) => o.expo_push_token)
        .map((o) => ({
          to: o.expo_push_token,
          sound: 'default',
          title: 'সাবস্ক্রিপশন রিমাইন্ডার',
          body: 'আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হতে চলেছে। সময়মতো পেমেন্ট করুন।',
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
      JSON.stringify({
        success: true,
        due_soon_count: dueSoonOwners?.length ?? 0,
        overdue_count: overdueOwners?.length ?? 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'সার্ভার ত্রুটি হয়েছে' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
