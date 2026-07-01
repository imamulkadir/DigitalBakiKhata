import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TextInput, FlatList,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import StatusPill from '../../components/StatusPill';
import { formatDate } from '../../utils/dateRelative';

interface OwnerRow {
  id: string;
  phone_number: string;
  shop_name: string | null;
  subscription_status: string | null;
  next_due_date: string | null;
  created_at: string;
  status: string;
}

export default function AllOwnersTab() {
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [filtered, setFiltered] = useState<OwnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, phone_number, shop_name, subscription_status, next_due_date, created_at, status')
        .eq('role', 'owner')
        .order('created_at', { ascending: false });
      const list = (data as OwnerRow[]) ?? [];
      setOwners(list);
      setFiltered(list);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(owners);
    } else {
      setFiltered(
        owners.filter(
          (o) =>
            o.phone_number.includes(search) ||
            (o.shop_name ?? '').toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, owners]);

  if (loading) return <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="ফোন নম্বর বা দোকানের নাম খুঁজুন"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.phone}>{item.phone_number}</Text>
                {item.shop_name && <Text style={styles.shop}>{item.shop_name}</Text>}
              </View>
              <StatusPill status={(item.subscription_status as any) ?? 'active'} />
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={styles.meta}>নিবন্ধন: {formatDate(item.created_at)}</Text>
              {item.next_due_date && (
                <Text style={styles.meta}>পরবর্তী: {formatDate(item.next_due_date)}</Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>কোনো দোকানদার পাওয়া যায়নি</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  search: {
    margin: 16, backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, marginBottom: 10, elevation: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, marginRight: 8 },
  phone: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  shop: { fontSize: 13, color: '#757575', marginTop: 2 },
  meta: { fontSize: 12, color: '#9E9E9E' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: '#757575' },
});
