import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAdminMenu } from '../context/AdminMenuContext';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  onAccountPress: () => void;
  onLogoutPress: () => void;
}

// Rendered as the last child inside AdminDashboardScreen's own root View —
// not a Modal. See AdminMenuContext for why.
export default function AdminAccountMenuOverlay({ onAccountPress, onLogoutPress }: Props) {
  const { t } = useTranslation();
  const { isOpen, close } = useAdminMenu();

  if (!isOpen) return null;

  return (
    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
      <View style={styles.panel}>
        <TouchableOpacity style={styles.menuItem} onPress={() => { close(); onAccountPress(); }} activeOpacity={0.7}>
          <Text style={styles.menuItemText}>{t('home.account')}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={() => { close(); onLogoutPress(); }} activeOpacity={0.7}>
          <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>{t('home.logout')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
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
