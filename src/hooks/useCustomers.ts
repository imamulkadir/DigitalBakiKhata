import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CustomerRow } from '../components/CustomerListItem';

export function useCustomers(ownerId: string) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('customer_balances')
      .select('customer_id, photo_url, voice_tag_url, fallback_label, balance')
      .eq('owner_id', ownerId)
      .order('balance', { ascending: false });

    if (err) {
      setError('গ্রাহক তালিকা লোড করতে সমস্যা হয়েছে');
    } else {
      setCustomers((data as CustomerRow[]) ?? []);
    }
    setLoading(false);
  }, [ownerId]);

  const addCustomer = useCallback(async (params: {
    photo_url?: string;
    voice_tag_url?: string;
    fallback_label: string;
    phone_number?: string;
  }) => {
    const { error: err } = await supabase.from('customers').insert({
      owner_id: ownerId,
      ...params,
    });
    if (err) throw new Error('গ্রাহক যোগ করতে সমস্যা হয়েছে');
    await fetchCustomers();
  }, [ownerId, fetchCustomers]);

  return { customers, loading, error, fetchCustomers, addCustomer };
}

export async function getCustomerDetail(customerId: string) {
  const { data, error } = await supabase
    .from('customer_balances')
    .select('*')
    .eq('customer_id', customerId)
    .single();
  if (error) throw new Error('গ্রাহকের তথ্য লোড করতে সমস্যা হয়েছে');
  return data;
}
