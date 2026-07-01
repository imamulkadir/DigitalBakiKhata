import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from './useAuth';

export function useSubscription(profile: Profile | null) {
  const [submitting, setSubmitting] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPaymentClaim = useCallback(async () => {
    if (!profile) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from('payment_claims').insert({
      owner_id: profile.id,
      amount: 100,
      status: 'pending',
    });
    if (err) {
      setError('পেমেন্ট ক্লেইম করতে সমস্যা হয়েছে');
    } else {
      setClaimed(true);
    }
    setSubmitting(false);
  }, [profile]);

  const isOverdue = profile?.subscription_status === 'overdue';
  const isDueSoon = profile?.subscription_status === 'due_soon';
  const isActive = profile?.subscription_status === 'active';

  return { submitting, claimed, error, submitPaymentClaim, isOverdue, isDueSoon, isActive };
}
