import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatDate } from '../../utils/dateRelative';

interface SentAnnouncement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Props {
  adminToken: string;
}

export default function AnnouncementsTab({ adminToken }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SentAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchSent() {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, created_at')
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
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTitle('');
      setContent('');
      await fetchSent();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
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
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending} activeOpacity={0.85}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>{t('announcements.send')}</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={sent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
        )}
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
  form: { backgroundColor: '#FFFFFF', padding: 16, elevation: 1 },
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
  sendButton: {
    backgroundColor: '#D32F2F', borderRadius: 30,
    paddingVertical: 14, alignItems: 'center',
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginBottom: 10, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', marginBottom: 4 },
  cardContent: { fontSize: 13, color: '#757575', marginBottom: 6 },
  cardDate: { fontSize: 12, color: '#9E9E9E' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, color: '#757575' },
});
