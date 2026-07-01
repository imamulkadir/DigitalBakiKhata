import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Audio } from 'expo-av';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OwnerStackParamList } from '../../navigation/OwnerStack';
import BalanceBadge from '../../components/BalanceBadge';
import { useTransactions, Transaction } from '../../hooks/useTransactions';
import { getCustomerDetail } from '../../hooks/useCustomers';
import { relativeDate } from '../../utils/dateRelative';
import { formatAmount } from '../../utils/currencyFormat';
import type { Profile } from '../../hooks/useAuth';

type Props = {
  navigation: NativeStackNavigationProp<OwnerStackParamList, 'CustomerDetail'>;
  route: RouteProp<OwnerStackParamList, 'CustomerDetail'>;
  profile: Profile;
};

interface CustomerDetail {
  customer_id: string;
  photo_url: string | null;
  voice_tag_url: string | null;
  fallback_label: string | null;
  phone_number: string | null;
  balance: number;
}

export default function CustomerDetailScreen({ navigation, route, profile }: Props) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const { transactions, loading, loadingMore, hasMore, fetchTransactions, loadMore } = useTransactions(customerId);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCustomerDetail(customerId);
        setCustomer(data as CustomerDetail);
      } catch {
        Alert.alert('ত্রুটি', 'গ্রাহকের তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoadingCustomer(false);
      }
    })();
    fetchTransactions(true);
  }, [customerId]);

  async function playVoiceTag() {
    if (!customer?.voice_tag_url) return;
    const { sound } = await Audio.Sound.createAsync({ uri: customer.voice_tag_url });
    await sound.playAsync();
  }

  function sendReminder() {
    if (!customer?.phone_number) return;
    const msg = encodeURIComponent(
      `আপনার বাকি আছে ৳${formatAmount(customer.balance)}। অনুগ্রহ করে পরিশোধ করুন।`
    );
    Linking.openURL(`https://wa.me/${customer.phone_number.replace('+', '')}?text=${msg}`);
  }

  const isOverdue = profile.subscription_status === 'overdue';

  if (loadingCustomer) {
    return <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 60 }} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarWrap} onPress={playVoiceTag} activeOpacity={customer?.voice_tag_url ? 0.7 : 1}>
          {customer?.photo_url ? (
            <Image source={{ uri: customer.photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
          )}
          {customer?.voice_tag_url && (
            <View style={styles.speakerBadge}>
              <Text style={{ fontSize: 14 }}>🔊</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.name}>{customer?.fallback_label ?? 'গ্রাহক'}</Text>
        {customer && <BalanceBadge balance={customer.balance} size="large" />}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.transactionButton]}
            onPress={() => !isOverdue && navigation.navigate('TransactionEntry', { customerId })}
            activeOpacity={isOverdue ? 1 : 0.85}
          >
            <Text style={styles.actionButtonText}>+ লেনদেন</Text>
          </TouchableOpacity>

          {customer?.phone_number && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reminderButton]}
              onPress={sendReminder}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: '#1565C0' }]}>রিমাইন্ডার পাঠান</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Transaction history */}
      {loading && transactions.length === 0 ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 24 }} />
      ) : (
        <FlashList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow item={item} />}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#D32F2F" /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>এখনও কোনো লেনদেন নেই</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function TransactionRow({ item }: { item: Transaction }) {
  const [playing, setPlaying] = useState(false);

  async function playVoice() {
    if (!item.voice_note_url || playing) return;
    setPlaying(true);
    const { sound } = await Audio.Sound.createAsync({ uri: item.voice_note_url });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) setPlaying(false); });
  }

  return (
    <View style={txStyles.row}>
      <View style={txStyles.left}>
        <Text style={[txStyles.amount, item.type === 'owes' ? txStyles.red : txStyles.green]}>
          {item.type === 'owes' ? '+' : '-'}৳{formatAmount(item.amount)}
        </Text>
        <Text style={txStyles.date}>{relativeDate(item.created_at)}</Text>
      </View>
      {item.voice_note_url && (
        <TouchableOpacity onPress={playVoice} activeOpacity={0.7}>
          <Text style={{ fontSize: 20 }}>{playing ? '⏸' : '🎤'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 44 },
  speakerBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 4,
  },
  name: { fontSize: 20, fontWeight: '500', color: '#1A1A1A', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  actionButton: {
    borderRadius: 30, paddingVertical: 12, paddingHorizontal: 20,
    borderWidth: 2,
  },
  transactionButton: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  reminderButton: { backgroundColor: '#FFFFFF', borderColor: '#1565C0' },
  actionButtonText: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, color: '#757575' },
});

const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 4,
    padding: 16, borderRadius: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  left: { flex: 1 },
  amount: { fontSize: 18, fontWeight: '500', marginBottom: 4 },
  red: { color: '#D32F2F' },
  green: { color: '#388E3C' },
  date: { fontSize: 13, color: '#9E9E9E' },
});
