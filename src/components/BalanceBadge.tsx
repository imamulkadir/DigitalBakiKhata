import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatAmount } from '../utils/currencyFormat';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  balance: number;
  size?: 'small' | 'large';
}

export default function BalanceBadge({ balance, size = 'small' }: Props) {
  const { t } = useTranslation();
  const isOwed = balance > 0;
  const color = isOwed ? '#D32F2F' : '#388E3C';
  const bgColor = isOwed ? '#FFEBEE' : '#E8F5E9';
  const label = isOwed ? t('balanceBadge.due') : t('balanceBadge.settled');

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, size === 'large' && styles.badgeLarge]}>
      <Text style={[styles.amount, { color }, size === 'large' && styles.amountLarge]}>
        ৳{formatAmount(Math.abs(balance))}
      </Text>
      {size === 'large' && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
  },
  badgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  amount: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountLarge: {
    fontSize: 32,
    fontWeight: '500',
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
});
