import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList, Modal,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatDate } from '../../utils/dateRelative';

interface SentAnnouncement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface Props {
  adminToken: string;
}

function getState(item: SentAnnouncement): 'active' | 'stopped' | 'expired' {
  if (!item.is_active) return 'stopped';
  if (item.expires_at && new Date(item.expires_at) <= new Date()) return 'expired';
  return 'active';
}

export default function AnnouncementsTab({ adminToken }: Props) {
  const { t } = useTranslation();
  const [formVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SentAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SentAnnouncement | null>(null);
  const [editDuration, setEditDuration] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  async function fetchSent() {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, created_at, expires_at, is_active')
      .order('created_at', { ascending: false });
    setSent(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchSent(); }, []);

  async function handleSend() {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t('common.error'), t('announcements.titleRequired'));
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          duration_days: durationDays ? parseInt(durationDays, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTitle('');
      setContent('');
      setDurationDays('7');
      setFormVisible(false);
      await fetchSent();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleStop(id: string) {
    setActionId(id);
    const { error } = await supabase.from('announcements').update({ is_active: false }).eq('id', id);
    if (error) Alert.alert(t('common.error'), t('announcements.stopError'));
    else await fetchSent();
    setActionId(null);
  }

  function openEdit(item: SentAnnouncement) {
    const state = getState(item);
    if (state === 'active' && item.expires_at) {
      const daysLeft = Math.ceil((new Date(item.expires_at).getTime() - Date.now()) / 86400000);
      setEditDuration(String(Math.max(daysLeft, 1)));
    } else if (state === 'active') {
      setEditDuration('');
    } else {
      setEditDuration('7');
    }
    setEditingItem(item);
  }

  async function handleSaveEdit() {
    if (!editingItem) return;
    setSavingEdit(true);
    const days = editDuration ? parseInt(editDuration, 10) : 0;
    const expires_at = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
    const { error } = await supabase
      .from('announcements')
      .update({ expires_at, is_active: true })
      .eq('id', editingItem.id);
    if (error) Alert.alert(t('common.error'), t('announcements.stopError'));
    else {
      setEditingItem(null);
      await fetchSent();
    }
    setSavingEdit(false);
  }

  function confirmDelete(item: SentAnnouncement) {
    Alert.alert(
      t('announcements.deleteConfirmTitle'),
      t('announcements.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.delete'), style: 'destructive', onPress: () => handleDelete(item.id) },
      ]
    );
  }

  async function handleDelete(id: string) {
    setActionId(id);
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) Alert.alert(t('common.error'), t('announcements.deleteError'));
    else await fetchSent();
    setActionId(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.addNewWrap}>
        <TouchableOpacity style={styles.addNewButton} onPress={() => setFormVisible(true)} activeOpacity={0.85}>
          <Text style={styles.addNewButtonText}>+ {t('announcements.addNew')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={formVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('announcements.formTitle')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('announcements.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('announcements.contentPlaceholder')}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={1000}
            />
            <Text style={styles.fieldLabel}>{t('announcements.durationLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="7"
              value={durationDays}
              onChangeText={(v) => setDurationDays(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.durationHint}>{t('announcements.durationHint')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setFormVisible(false)}
                disabled={sending}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending} activeOpacity={0.85}>
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>{t('announcements.send')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!editingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('announcements.editDeadlineTitle')}</Text>
            <Text style={styles.fieldLabel}>{t('announcements.durationLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="7"
              value={editDuration}
              onChangeText={(v) => setEditDuration(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.durationHint}>{t('announcements.durationHint')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingItem(null)}
                disabled={savingEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton} onPress={handleSaveEdit} disabled={savingEdit} activeOpacity={0.85}>
                {savingEdit ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>{t('common.save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={sent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const state = getState(item);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={[styles.statusPill, styles[`status_${state}`]]}>
                  <Text style={[styles.statusPillText, styles[`statusText_${state}`]]}>
                    {t(`announcements.state_${state}`)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
              {item.expires_at && (
                <Text style={styles.cardDate}>{t('announcements.expiresOn')}: {formatDate(item.expires_at)}</Text>
              )}
              <View style={styles.cardActions}>
                {state === 'active' ? (
                  <>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEdit(item)}
                      disabled={actionId === item.id}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editBtnText}>{t('announcements.editDeadline')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stopBtn}
                      onPress={() => handleStop(item.id)}
                      disabled={actionId === item.id}
                      activeOpacity={0.7}
                    >
                      {actionId === item.id ? (
                        <ActivityIndicator size="small" color="#E65100" />
                      ) : (
                        <Text style={styles.stopBtnText}>{t('announcements.stop')}</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => openEdit(item)}
                    disabled={actionId === item.id}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.startBtnText}>{t('announcements.start')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => confirmDelete(item)}
                  disabled={actionId === item.id}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteBtnText}>{t('admin.delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color="#D32F2F" style={{ marginTop: 24 }} />
            : <View style={styles.empty}><Text style={styles.emptyText}>{t('announcements.noneSent')}</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  addNewWrap: { backgroundColor: '#FFFFFF', padding: 16, elevation: 1 },
  addNewButton: {
    backgroundColor: '#D32F2F', borderRadius: 30,
    paddingVertical: 14, alignItems: 'center',
  },
  addNewButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '500', color: '#1A1A1A', marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelButton: {
    flex: 1, borderRadius: 30, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  cancelButtonText: { color: '#757575', fontSize: 16, fontWeight: '500' },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    color: '#1A1A1A',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 13, color: '#757575', marginBottom: 6 },
  durationHint: { fontSize: 12, color: '#9E9E9E', marginTop: -4, marginBottom: 12 },
  sendButton: {
    flex: 1, backgroundColor: '#D32F2F', borderRadius: 30,
    paddingVertical: 14, alignItems: 'center',
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginBottom: 10, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', marginBottom: 4, flex: 1 },
  cardContent: { fontSize: 13, color: '#757575', marginBottom: 6 },
  cardDate: { fontSize: 12, color: '#9E9E9E' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '500' },
  status_active: { backgroundColor: '#E8F5E9' },
  statusText_active: { color: '#388E3C' },
  status_stopped: { backgroundColor: '#F5F5F5' },
  statusText_stopped: { color: '#757575' },
  status_expired: { backgroundColor: '#FFF3E0' },
  statusText_expired: { color: '#E65100' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stopBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#E65100',
  },
  stopBtnText: { fontSize: 13, color: '#E65100', fontWeight: '500' },
  editBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#1565C0',
  },
  editBtnText: { fontSize: 13, color: '#1565C0', fontWeight: '500' },
  startBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#388E3C',
  },
  startBtnText: { fontSize: 13, color: '#388E3C', fontWeight: '500' },
  deleteBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#D32F2F',
  },
  deleteBtnText: { fontSize: 13, color: '#D32F2F', fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, color: '#757575' },
});
