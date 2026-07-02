import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TextInput, FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import StatusPill from '../../components/StatusPill';
import { formatDate } from '../../utils/dateRelative';
import { useTranslation } from '../../i18n/LanguageContext';

interface OwnerRow {
  id: string;
  phone_number: string;
  shop_name: string | null;
  subscription_status: string | null;
  next_due_date: string | null;
  created_at: string;
  status: string;
}

interface Props {
  adminToken: string;
}

export default function AllOwnersTab({ adminToken }: Props) {
  const { t } = useTranslation();
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [filtered, setFiltered] = useState<OwnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchOwners() {
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
  }

  useEffect(() => { fetchOwners(); }, []);

  function confirmDelete(owner: OwnerRow) {
    Alert.alert(
      t('admin.deleteConfirmTitle'),
      t('admin.deleteConfirmMessage', { phone: owner.phone_number }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.delete'), style: 'destructive', onPress: () => handleDelete(owner.id) },
      ]
    );
  }

  async function handleDelete(ownerId: string) {
    setDeletingId(ownerId);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ owner_id: ownerId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchOwners();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('admin.deleteError'));
    } finally {
      setDeletingId(null);
    }
  }

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
        placeholder={t('admin.searchPlaceholder')}
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
              <Text style={styles.meta}>{t('admin.registeredOn')}: {formatDate(item.created_at)}</Text>
              {item.next_due_date && (
                <Text style={styles.meta}>{t('admin.nextDue')}: {formatDate(item.next_due_date)}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => confirmDelete(item)}
              disabled={deletingId === item.id}
              activeOpacity={0.7}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color="#D32F2F" />
              ) : (
                <Text style={styles.deleteBtnText}>{t('admin.delete')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('admin.noOwners')}</Text>
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
  deleteBtn: {
    marginTop: 10, alignSelf: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#D32F2F',
  },
  deleteBtnText: { fontSize: 13, color: '#D32F2F', fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: '#757575' },
});
