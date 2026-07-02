import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n/LanguageContext';

export interface Transaction {
  id: string;
  customer_id: string;
  owner_id: string;
  amount: number;
  type: 'owes' | 'paid';
  voice_note_url: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export function useTransactions(customerId: string) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchTransactions = useCallback(async (reset = false) => {
    if (reset) {
      setPage(0);
      setTransactions([]);
      setHasMore(true);
    }
    setLoading(true);
    setError(null);
    const from = reset ? 0 : page * PAGE_SIZE;
    const { data, error: err } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (err) {
      setError(t('customerDetail.loadTransactionsError'));
    } else {
      const fetched = (data as Transaction[]) ?? [];
      setTransactions((prev) => (reset ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length === PAGE_SIZE);
      if (!reset) setPage((p) => p + 1);
    }
    setLoading(false);
  }, [customerId, page, t]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const from = (page + 1) * PAGE_SIZE;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    const fetched = (data as Transaction[]) ?? [];
    setTransactions((prev) => [...prev, ...fetched]);
    setHasMore(fetched.length === PAGE_SIZE);
    setPage((p) => p + 1);
    setLoadingMore(false);
  }, [customerId, page, hasMore, loadingMore]);

  const addTransaction = useCallback(async (params: {
    owner_id: string;
    amount: number;
    type: 'owes' | 'paid';
    voice_note_url?: string;
  }) => {
    const { error: err } = await supabase.from('transactions').insert({
      customer_id: customerId,
      ...params,
    });
    if (err) throw new Error(t('transactionEntry.saveError'));
    await fetchTransactions(true);
  }, [customerId, fetchTransactions, t]);

  return { transactions, loading, loadingMore, hasMore, error, fetchTransactions, loadMore, addTransaction };
}
