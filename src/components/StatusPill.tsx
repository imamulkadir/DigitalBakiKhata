import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Status = 'active' | 'due_soon' | 'overdue' | 'pending_approval' | 'rejected' | 'suspended';

const CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  active: { label: 'সক্রিয়', bg: '#E8F5E9', color: '#388E3C' },
  due_soon: { label: 'শেষ হতে চলেছে', bg: '#FFF3E0', color: '#E65100' },
  overdue: { label: 'মেয়াদোত্তীর্ণ', bg: '#FFEBEE', color: '#D32F2F' },
  pending_approval: { label: 'অনুমোদনের অপেক্ষায়', bg: '#E3F2FD', color: '#1565C0' },
  rejected: { label: 'প্রত্যাখ্যাত', bg: '#FFEBEE', color: '#D32F2F' },
  suspended: { label: 'স্থগিত', bg: '#F5F5F5', color: '#757575' },
};

interface Props {
  status: Status;
}

export default function StatusPill({ status }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.suspended;
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
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
