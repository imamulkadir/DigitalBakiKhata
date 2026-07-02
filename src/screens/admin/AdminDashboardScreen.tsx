import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import PendingApprovalsTab from './PendingApprovalsTab';
import PaymentConfirmationTab from './PaymentConfirmationTab';
import AllOwnersTab from './AllOwnersTab';
import AnnouncementsTab from './AnnouncementsTab';
import { useTranslation } from '../../i18n/LanguageContext';
import type { Profile } from '../../hooks/useAuth';

type Tab = 'pending' | 'payments' | 'all' | 'announcements';

interface Props {
  profile: Profile;
  token: string;
  onLogout: () => void;
}

interface Counts {
  pending: number;
  due_soon: number;
  overdue: number;
}

export default function AdminDashboardScreen({ profile, token, onLogout }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [counts, setCounts] = useState<Counts>({ pending: 0, due_soon: 0, overdue: 0 });
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingCounts(true);
      const [{ count: pending }, { count: due_soon }, { count: overdue }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval').eq('role', 'owner'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'due_soon').eq('role', 'owner'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'overdue').eq('role', 'owner'),
      ]);
      setCounts({ pending: pending ?? 0, due_soon: due_soon ?? 0, overdue: overdue ?? 0 });
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
        {activeTab === 'all' && <AllOwnersTab />}
        {activeTab === 'announcements' && <AnnouncementsTab adminToken={token} />}
      </View>
    </View>
  );
}

function MetricCard({ label, value, color, loading }: { label: string; value: number; color: string; loading: boolean }) {
  return (
    <View style={[styles.metricCard, { borderTopColor: color }]}>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
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
    flexDirection: 'row', padding: 16, gap: 10,
  },
  metricCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderTopWidth: 3, elevation: 1,
  },
  metricValue: { fontSize: 28, fontWeight: '500', marginBottom: 4 },
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
