import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { useHeaderMenu } from '../context/HeaderMenuContext';

interface Props {
  photoUrl: string | null;
}

// The one and only instance of these icons — rendered into the native
// header via headerRight. No duplicate/decoy copy anywhere, so there's
// nothing to keep in sync, nothing to measure, and nothing that can flicker
// or remount: it's a single stable component for the screen's lifetime.
export default function HeaderTriggerIcons({ photoUrl }: Props) {
  const { toggleMenu, unreadCount } = useHeaderMenu();

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => toggleMenu('notifications')} activeOpacity={0.7} style={styles.bellWrap}>
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && <View style={styles.unreadDot} />}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => toggleMenu('account')} activeOpacity={0.7}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bellWrap: { marginRight: 16 },
  bellIcon: { fontSize: 20 },
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    width: 9, height: 9, borderRadius: 5, backgroundColor: '#D32F2F',
    borderWidth: 1, borderColor: '#FFFFFF',
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 16 },
});
