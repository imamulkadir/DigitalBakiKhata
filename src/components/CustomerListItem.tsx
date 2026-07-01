import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import BalanceBadge from './BalanceBadge';

export interface CustomerRow {
  customer_id: string;
  photo_url: string | null;
  voice_tag_url: string | null;
  fallback_label: string | null;
  balance: number;
}

interface Props {
  item: CustomerRow;
  onPress: (id: string) => void;
}

export default function CustomerListItem({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(item.customer_id)} activeOpacity={0.75}>
      <View style={styles.avatar}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        )}
        {item.voice_tag_url ? (
          <View style={styles.voiceBadge}>
            <Text style={{ fontSize: 10 }}>🔊</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {item.fallback_label ?? 'গ্রাহক'}
      </Text>
      <BalanceBadge balance={item.balance} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    marginRight: 12,
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 22,
  },
  voiceBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 2,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
});
