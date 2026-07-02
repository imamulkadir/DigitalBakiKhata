import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import { getCurrentLanguage } from '../i18n/currentLanguage';
import type { CustomerRow } from '../components/CustomerListItem';

function tt(path: string): string {
  return path.split('.').reduce((acc: any, key) => acc?.[key], translations[getCurrentLanguage()]) ?? path;
}

export function useCustomers(ownerId: string) {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('customer_balances')
      .select('customer_id, photo_url, voice_tag_url, fallback_label, name, balance')
      .eq('owner_id', ownerId)
      .order('balance', { ascending: false });

    if (err) {
      setError(t('home.loadError'));
    } else {
      setCustomers((data as CustomerRow[]) ?? []);
    }
    setLoading(false);
  }, [ownerId, t]);

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
    if (err) throw new Error(t('addCustomer.saveError'));
    await fetchCustomers();
  }, [ownerId, fetchCustomers, t]);

  return { customers, loading, error, fetchCustomers, addCustomer };
}

// Plain (non-hook) functions — read the active language via the module-level
// getter/setter (mirrors setSupabaseToken/currentToken) since they can't call
// useTranslation() themselves.
export async function getCustomerDetail(customerId: string) {
  const { data, error } = await supabase
    .from('customer_balances')
    .select('*')
    .eq('customer_id', customerId)
    .single();
  if (error) throw new Error(tt('customerDetail.loadError'));
  return data;
}

export async function updateCustomer(customerId: string, fields: {
  name?: string;
  address?: string;
  phone_number?: string;
}) {
  const { error } = await supabase.from('customers').update(fields).eq('id', customerId);
  if (error) throw new Error(tt('editCustomer.saveError'));
}
