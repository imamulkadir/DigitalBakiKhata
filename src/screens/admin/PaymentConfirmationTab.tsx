import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, FlatList,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../hooks/useAuth';

interface PaymentClaim {
  id: string;
  owner_id: string;
  claimed_at: string;
  amount: number;
  profiles: { phone_number: string; shop_name: string | null } | null;
}

interface Props {
  adminProfile: Profile;
  adminToken: string;
}

export default function PaymentConfirmationTab({ adminProfile, adminToken }: Props) {
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchClaims() {
    setLoading(true);
    const { data } = await supabase
      .from('payment_claims')
      .select('id, owner_id, claimed_at, amount, profiles(phone_number, shop_name)')
      .eq('status', 'pending')
      .order('claimed_at', { ascending: true });
    setClaims((data as unknown as PaymentClaim[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchClaims(); }, []);

  async function handleAction(claim_id: string, action: 'confirm' | 'reject') {
    setActionLoading(claim_id);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ claim_id, action }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchClaims();
    } catch (e: any) {
      Alert.alert('ত্রুটি', e.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />;

  return (
    <FlatList
      data={claims}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.info}>
            <Text style={styles.phone}>{item.profiles?.phone_number}</Text>
            {item.profiles?.shop_name && <Text style={styles.shop}>{item.profiles.shop_name}</Text>}
            <Text style={styles.amount}>৳{item.amount}</Text>
            <Text style={styles.date}>{new Date(item.claimed_at).toLocaleDateString('bn-BD')}</Text>
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => handleAction(item.id, 'confirm')}
              disabled={actionLoading === item.id}
              activeOpacity={0.85}
            >
              {actionLoading === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnText}>নিশ্চিত করুন</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={() => handleAction(item.id, 'reject')}
              disabled={actionLoading === item.id}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: '#D32F2F' }]}>প্রত্যাখ্যান করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>কোনো পেমেন্ট নিশ্চিতকরণ বাকি নেই</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 1,
  },
  info: { marginBottom: 12 },
  phone: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  shop: { fontSize: 14, color: '#757575', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '500', color: '#388E3C', marginTop: 4 },
  date: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', borderWidth: 1.5,
  },
  confirmBtn: { backgroundColor: '#388E3C', borderColor: '#388E3C' },
  rejectBtn: { backgroundColor: '#FFFFFF', borderColor: '#D32F2F' },
  btnText: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: '#757575' },
});
