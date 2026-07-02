import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import PendingApprovalsTab from './PendingApprovalsTab';
import PaymentConfirmationTab from './PaymentConfirmationTab';
import AllOwnersTab from './AllOwnersTab';
import AnnouncementsTab from './AnnouncementsTab';
import AdminAccountMenuOverlay from '../../components/AdminAccountMenuOverlay';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatAmount } from '../../utils/currencyFormat';
import type { Profile } from '../../hooks/useAuth';

type Tab = 'pending' | 'payments' | 'all' | 'announcements';

interface Props {
  profile: Profile;
  token: string;
  onAccountPress: () => void;
  onLogoutPress: () => void;
}

interface Counts {
  pending: number;
  due_soon: number;
  overdue: number;
  totalOwners: number;
  totalRevenue: number;
  rejectedSuspended: number;
}

export default function AdminDashboardScreen({ profile, token, onAccountPress, onLogoutPress }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [counts, setCounts] = useState<Counts>({
    pending: 0, due_soon: 0, overdue: 0, totalOwners: 0, totalRevenue: 0, rejectedSuspended: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingCounts(true);
      const [
        { count: pending }, { count: due_soon }, { count: overdue },
        { count: totalOwners }, { data: confirmedClaims }, { count: rejectedSuspended },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval').eq('role', 'owner'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'due_soon').eq('role', 'owner'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'overdue').eq('role', 'owner'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
        supabase.from('payment_claims').select('amount').eq('status', 'confirmed'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner').in('status', ['rejected', 'suspended']),
      ]);
      const totalRevenue = (confirmedClaims ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
      setCounts({
        pending: pending ?? 0, due_soon: due_soon ?? 0, overdue: overdue ?? 0,
        totalOwners: totalOwners ?? 0, totalRevenue, rejectedSuspended: rejectedSuspended ?? 0,
      });
      setLoadingCounts(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* Metric cards */}
      <View style={styles.metricsRow}>
        <MetricCard label={t('admin.pendingCount')} value={counts.pending} color="#1565C0" loading={loadingCounts} />
        <MetricCard label={t('admin.dueSoonCount')} value={counts.due_soon} color="#E65100" loading={loadingCounts} />
        <MetricCard label={t('admin.overdueCount')} value={counts.overdue} color="#D32F2F" loading={loadingCounts} />
      </View>
      <View style={[styles.metricsRow, styles.metricsRowLast]}>
        <MetricCard label={t('admin.totalOwnersCount')} value={counts.totalOwners} color="#388E3C" loading={loadingCounts} />
        <MetricCard label={t('admin.totalRevenueCount')} value={`৳${formatAmount(counts.totalRevenue)}`} color="#6A1B9A" loading={loadingCounts} />
        <MetricCard label={t('admin.rejectedSuspendedCount')} value={counts.rejectedSuspended} color="#616161" loading={loadingCounts} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TabButton label={t('admin.tabPending')} active={activeTab === 'pending'} onPress={() => setActiveTab('pending')} />
        <TabButton label={t('admin.tabPayments')} active={activeTab === 'payments'} onPress={() => setActiveTab('payments')} />
        <TabButton label={t('admin.tabAll')} active={activeTab === 'all'} onPress={() => setActiveTab('all')} />
        <TabButton label={t('admin.tabAnnouncements')} active={activeTab === 'announcements'} onPress={() => setActiveTab('announcements')} />
      </View>

      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === 'pending' && <PendingApprovalsTab adminProfile={profile} adminToken={token} />}
        {activeTab === 'payments' && <PaymentConfirmationTab adminProfile={profile} adminToken={token} />}
        {activeTab === 'all' && <AllOwnersTab adminToken={token} />}
        {activeTab === 'announcements' && <AnnouncementsTab adminToken={token} />}
      </View>

      <AdminAccountMenuOverlay onAccountPress={onAccountPress} onLogoutPress={onLogoutPress} />
    </View>
  );
}

function MetricCard({ label, value, color, loading }: { label: string; value: number | string; color: string; loading: boolean }) {
  return (
    <View style={[styles.metricCard, { borderTopColor: color }]}>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={[styles.metricValue, styles.metricValueCompact]} numberOfLines={1} adjustsFontSizeToFit>
          <Text style={{ color }}>{value}</Text>
        </Text>
      )}
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  metricsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10,
  },
  metricsRowLast: {
    marginBottom: 12,
  },
  metricCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderTopWidth: 3, elevation: 1,
  },
  metricValue: { fontSize: 28, fontWeight: '500', marginBottom: 4 },
  metricValueCompact: { fontSize: 22 },
  metricLabel: { fontSize: 11, color: '#757575', textAlign: 'center' },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: '#D32F2F' },
  tabButtonText: { fontSize: 13, color: '#757575', fontWeight: '500' },
  tabButtonTextActive: { color: '#D32F2F' },
  tabContent: { flex: 1 },
});
