import React from 'react';
import { View, TouchableOpacity, Text, FlatList, ScrollView, StyleSheet } from 'react-native';
import { useHeaderMenu } from '../context/HeaderMenuContext';
import { useTranslation } from '../i18n/LanguageContext';
import { formatDate } from '../utils/dateRelative';

interface Props {
  onAccountPress: () => void;
  onLogoutPress: () => void;
}

// Rendered as the LAST child inside a screen's own root View (absolute,
// filling that View) — not a React Native <Modal>. A screen's body sits
// below the native header as a separate native layer in native-stack, so
// this overlay can never cover the header: the real header icons
// (HeaderTriggerIcons) stay untouched and tappable the entire time, with no
// duplicate/decoy layer needed to work around a Modal blocking them.
export default function HeaderMenuOverlay({ onAccountPress, onLogoutPress }: Props) {
  const { t } = useTranslation();
  const { activeMenu, closeMenu, announcements, unreadCount, notifView, selected, openDetail, markAllRead } = useHeaderMenu();

  if (activeMenu === 'none') return null;

  const isDetail = activeMenu === 'notifications' && notifView === 'detail';

  return (
    <TouchableOpacity
      style={isDetail ? styles.backdropCentered : styles.backdropAnchored}
      activeOpacity={1}
      onPress={closeMenu}
    >
      {activeMenu === 'account' && (
        <View style={styles.panelAnchored}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); onAccountPress(); }} activeOpacity={0.7}>
            <Text style={styles.menuItemText}>{t('home.account')}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); onLogoutPress(); }} activeOpacity={0.7}>
            <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>{t('home.logout')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeMenu === 'notifications' && notifView === 'list' && (
        <View style={[styles.panelAnchored, styles.notifPanel]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{t('announcements.bellTitle')}</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead}>
                <Text style={styles.markAllText}>{t('announcements.markAllRead')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={announcements}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.listItem} onPress={() => openDetail(item)} activeOpacity={0.7}>
                {!item.is_read && <View style={styles.itemDot} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('announcements.empty')}</Text>}
          />
        </View>
      )}

      {isDetail && selected && (
        <View style={styles.panelCentered}>
          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text style={styles.itemDate}>{formatDate(selected.created_at)}</Text>
          <ScrollView style={styles.detailScroll}>
            <Text style={styles.detailContent}>{selected.content}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={closeMenu} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdropAnchored: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropCentered: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panelAnchored: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  notifPanel: {
    width: 300,
    padding: 16,
    maxHeight: 400,
  },
  panelCentered: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: '75%',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  panelHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingHorizontal: 4,
  },
  panelTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  markAllText: { fontSize: 12, color: '#1565C0', fontWeight: '500' },
  list: { maxHeight: 320 },
  listItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  itemDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F',
    marginTop: 5,
  },
  itemTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  itemDate: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center', paddingVertical: 24 },
  detailTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginBottom: 4 },
  detailScroll: { maxHeight: 220, marginTop: 10, marginBottom: 12 },
  detailContent: { fontSize: 14, color: '#424242', lineHeight: 22 },
  closeButton: {
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingVertical: 10, alignItems: 'center',
  },
  closeButtonText: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
});
