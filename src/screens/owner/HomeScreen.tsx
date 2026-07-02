import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { OwnerStackParamList } from '../../navigation/OwnerStack';
import CustomerListItem, { CustomerRow } from '../../components/CustomerListItem';
import { useCustomers } from '../../hooks/useCustomers';
import { formatAmount } from '../../utils/currencyFormat';
import { useTranslation } from '../../i18n/LanguageContext';
import type { Profile } from '../../hooks/useAuth';

type Props = {
  navigation: NativeStackNavigationProp<OwnerStackParamList, 'Home'>;
  profile: Profile;
};

export default function HomeScreen({ navigation, profile }: Props) {
  const { t } = useTranslation();
  const { customers, loading, error, fetchCustomers } = useCustomers(profile.id);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useFocusEffect(useCallback(() => { fetchCustomers(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  }

  const totalBaki = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const isOverdue = profile.subscription_status === 'overdue';
  const isDueSoon = profile.subscription_status === 'due_soon';

  return (
    <View style={styles.container}>
      {/* Subscription banners */}
      {isOverdue && (
        <View style={styles.overdueBanner}>
          <Text style={styles.overdueBannerText}>{t('home.overdueBanner')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.bannerLink}>{t('home.payNow')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {isDueSoon && !dismissedBanner && (
        <View style={styles.dueSoonBanner}>
          <Text style={styles.dueSoonBannerText}>{t('home.dueSoonBanner')}</Text>
          <View style={styles.bannerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
              <Text style={styles.bannerLink}>{t('home.viewLink')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDismissedBanner(true)} style={{ marginLeft: 16 }}>
              <Text style={styles.bannerDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Total balance summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{t('home.totalDue')}</Text>
        <Text style={styles.summaryAmount}>৳{formatAmount(totalBaki)}</Text>
      </View>

      {/* Customer list */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
      ) : (
        <FlashList
          data={customers}
          keyExtractor={(item) => item.customer_id}
          renderItem={({ item }) => (
            <CustomerListItem
              item={item}
              onPress={(id) => navigation.navigate('CustomerDetail', { customerId: id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>{t('home.emptyList')}</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => !isOverdue && navigation.navigate('AddCustomer')}
                activeOpacity={isOverdue ? 1 : 0.8}
              >
                <Text style={styles.emptyButtonText}>{t('home.addFirstCustomer')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      {!isOverdue && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddCustomer')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+ {t('home.addCustomer')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  overdueBanner: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  overdueBannerText: { color: '#B71C1C', fontSize: 14, fontWeight: '500', marginBottom: 6 },
  dueSoonBanner: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueSoonBannerText: { color: '#E65100', fontSize: 14, flex: 1 },
  bannerActions: { flexDirection: 'row', alignItems: 'center' },
  bannerLink: { color: '#1565C0', fontSize: 13, fontWeight: '500' },
  bannerDismiss: { color: '#757575', fontSize: 16 },
  summaryCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  summaryLabel: { fontSize: 15, color: '#757575', marginBottom: 6 },
  summaryAmount: { fontSize: 36, fontWeight: '500', color: '#D32F2F' },
  listContent: { paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#757575', textAlign: 'center', marginBottom: 24 },
  emptyButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#D32F2F',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});
