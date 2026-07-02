import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Modal, FlatList, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnnouncements, Announcement } from '../hooks/useAnnouncements';
import { useTranslation } from '../i18n/LanguageContext';
import { formatDate } from '../utils/dateRelative';

interface Props {
  ownerId: string;
}

export default function NotificationBellButton({ ownerId }: Props) {
  const { t } = useTranslation();
  const { announcements, fetchAnnouncements, markRead, markAllRead } = useAnnouncements(ownerId);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selected, setSelected] = useState<Announcement | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  function openBell() {
    setVisible(true);
    setView('list');
    fetchAnnouncements();
  }

  async function openDetail(a: Announcement) {
    setSelected(a);
    setView('detail');
    if (!a.is_read) await markRead(a.id);
  }

  return (
    <>
      <TouchableOpacity onPress={openBell} activeOpacity={0.7} style={styles.bellWrap}>
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && <View style={styles.unreadDot} />}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.panel, { top: insets.top + 48 }]}>
            {view === 'list' ? (
              <>
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
              </>
            ) : selected && (
              <>
                <TouchableOpacity onPress={() => setView('list')}>
                  <Text style={styles.backText}>← {t('common.back')}</Text>
                </TouchableOpacity>
                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.itemDate}>{formatDate(selected.created_at)}</Text>
                <ScrollView style={styles.detailScroll}>
                  <Text style={styles.detailContent}>{selected.content}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)} activeOpacity={0.85}>
                  <Text style={styles.closeButtonText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellWrap: { marginRight: 16 },
  bellIcon: { fontSize: 20 },
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    width: 9, height: 9, borderRadius: 5, backgroundColor: '#D32F2F',
    borderWidth: 1, borderColor: '#FFFFFF',
  },
  backdrop: { flex: 1 },
  panel: {
    position: 'absolute',
    right: 12,
    left: 12,
    maxWidth: 320,
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    maxHeight: 400,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
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
  backText: { fontSize: 13, color: '#1565C0', marginBottom: 8 },
  detailTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginBottom: 4 },
  detailScroll: { maxHeight: 220, marginTop: 10, marginBottom: 12 },
  detailContent: { fontSize: 14, color: '#424242', lineHeight: 22 },
  closeButton: {
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingVertical: 10, alignItems: 'center',
  },
  closeButtonText: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
});
