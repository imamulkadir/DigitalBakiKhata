import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSubscription } from '../../hooks/useSubscription';
import StatusPill from '../../components/StatusPill';
import { formatDate } from '../../utils/dateRelative';
import type { Profile } from '../../hooks/useAuth';

interface Props {
  profile: Profile;
}

const BKASH_NUMBER = '০১৭১৭৮৩৬৬৭২';

export default function SubscriptionScreen({ profile }: Props) {
  const { submitting, claimed, error, submitPaymentClaim } = useSubscription(profile);

  async function copyBkashNumber() {
    await Clipboard.setStringAsync('01717836672');
    Alert.alert('কপি হয়েছে', 'বিকাশ নম্বর কপি করা হয়েছে');
  }

  const subStatus = (profile.subscription_status ?? 'active') as any;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>সাবস্ক্রিপশন</Text>

      {/* Status */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>অবস্থা</Text>
          <StatusPill status={subStatus} />
        </View>
        {profile.next_due_date && (
          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={styles.label}>পরবর্তী পেমেন্টের তারিখ</Text>
            <Text style={styles.value}>{formatDate(profile.next_due_date)}</Text>
          </View>
        )}
      </View>

      {/* Payment instructions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>পেমেন্ট করার নিয়ম</Text>
        <Text style={styles.step}>১. আপনার বিকাশ অ্যাপ খুলুন।</Text>
        <Text style={styles.step}>২. "Send Money" বা "পাঠাও" নির্বাচন করুন।</Text>
        <Text style={styles.step}>৩. নিচের নম্বরে ৳১০০ পাঠান:</Text>

        <TouchableOpacity style={styles.bkashBox} onPress={copyBkashNumber} activeOpacity={0.8}>
          <Text style={styles.bkashNumber}>{BKASH_NUMBER}</Text>
          <Text style={styles.copyHint}>চাপ দিয়ে কপি করুন</Text>
        </TouchableOpacity>

        <Text style={styles.step}>৪. Reference-এ আপনার নিজের নম্বর লিখুন:</Text>
        <View style={styles.refBox}>
          <Text style={styles.refLabel}>এই নম্বরটি Reference-এ লিখুন</Text>
          <Text style={styles.refNumber}>{profile.phone_number}</Text>
        </View>
        <Text style={styles.step}>৫. পাঠানো হলে নিচের বাটনে চাপ দিন।</Text>
      </View>

      {/* Claim button */}
      {claimed ? (
        <View style={styles.claimedBox}>
          <Text style={styles.claimedText}>✓ নিশ্চিতকরণের অপেক্ষায়</Text>
          <Text style={styles.claimedSubtext}>অ্যাডমিন যাচাই করার পর আপনার সাবস্ক্রিপশন সক্রিয় হবে</Text>
        </View>
      ) : (
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={styles.claimButton}
            onPress={submitPaymentClaim}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.claimButtonText}>পাঠিয়েছি</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  heading: { fontSize: 22, fontWeight: '500', color: '#1A1A1A', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginBottom: 16, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, color: '#757575' },
  value: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginBottom: 12 },
  step: { fontSize: 15, color: '#424242', marginBottom: 8, lineHeight: 24 },
  bkashBox: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16,
    alignItems: 'center', marginVertical: 8,
  },
  bkashNumber: { fontSize: 28, fontWeight: '500', color: '#2E7D32', letterSpacing: 2 },
  copyHint: { fontSize: 12, color: '#388E3C', marginTop: 4 },
  refBox: {
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14,
    alignItems: 'center', marginVertical: 8,
  },
  refLabel: { fontSize: 12, color: '#1565C0', marginBottom: 4 },
  refNumber: { fontSize: 20, fontWeight: '500', color: '#0D47A1' },
  claimButton: {
    backgroundColor: '#388E3C', borderRadius: 30,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  claimButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' },
  claimedBox: {
    backgroundColor: '#E8F5E9', borderRadius: 12,
    padding: 20, alignItems: 'center', marginTop: 8,
  },
  claimedText: { fontSize: 18, color: '#2E7D32', fontWeight: '500', marginBottom: 6 },
  claimedSubtext: { fontSize: 14, color: '#388E3C', textAlign: 'center' },
  error: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 8 },
});
