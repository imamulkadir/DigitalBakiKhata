import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';

type Status = 'active' | 'due_soon' | 'overdue' | 'pending_approval' | 'rejected' | 'suspended';

const CONFIG: Record<Status, { bg: string; color: string }> = {
  active: { bg: '#E8F5E9', color: '#388E3C' },
  due_soon: { bg: '#FFF3E0', color: '#E65100' },
  overdue: { bg: '#FFEBEE', color: '#D32F2F' },
  pending_approval: { bg: '#E3F2FD', color: '#1565C0' },
  rejected: { bg: '#FFEBEE', color: '#D32F2F' },
  suspended: { bg: '#F5F5F5', color: '#757575' },
};

interface Props {
  status: Status;
}

export default function StatusPill({ status }: Props) {
  const { t } = useTranslation();
  const cfg = CONFIG[status] ?? CONFIG.suspended;
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{t('status.' + status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
