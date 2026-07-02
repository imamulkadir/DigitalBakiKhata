import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Image, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  photoUrl: string | null;
  onAccountPress: () => void;
  onLogoutPress: () => void;
}

export default function AccountMenuButton({ photoUrl, onAccountPress, onLogoutPress }: Props) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.7}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.menu, { top: insets.top + 48 }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setVisible(false); onAccountPress(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>অ্যাকাউন্ট</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setVisible(false); onLogoutPress(); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>লগআউট</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 16 },
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 140,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
});
