import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OwnerStackParamList } from '../../navigation/OwnerStack';
import NumericKeypad from '../../components/NumericKeypad';
import VoiceRecorder from '../../components/VoiceRecorder';
import { useTransactions } from '../../hooks/useTransactions';
import { uploadFile } from '../../utils/uploadFile';
import { formatAmount, formatDigits } from '../../utils/currencyFormat';
import { useTranslation } from '../../i18n/LanguageContext';
import type { Profile } from '../../hooks/useAuth';

type Props = {
  navigation: NativeStackNavigationProp<OwnerStackParamList, 'TransactionEntry'>;
  route: RouteProp<OwnerStackParamList, 'TransactionEntry'>;
  profile: Profile;
};

export default function TransactionEntryScreen({ navigation, route, profile }: Props) {
  const { t } = useTranslation();
  const { customerId } = route.params;
  const [type, setType] = useState<'owes' | 'paid'>('owes');
  const [amountStr, setAmountStr] = useState('');
  const [voiceNoteUri, setVoiceNoteUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { addTransaction } = useTransactions(customerId);

  function handleKey(key: string) {
    if (amountStr.length >= 10) return;
    if (key === '.' && amountStr.includes('.')) return;
    setAmountStr((prev) => prev + key);
  }

  function handleBackspace() {
    setAmountStr((prev) => prev.slice(0, -1));
  }

  async function handleSave() {
    const amount = parseFloat(amountStr);
    if (!amountStr || isNaN(amount) || amount <= 0) {
      Alert.alert(t('common.error'), t('transactionEntry.invalidAmount'));
      return;
    }

    setSaving(true);
    try {
      let voice_note_url: string | undefined;

      if (voiceNoteUri) {
        voice_note_url = await uploadFile(
          voiceNoteUri,
          'voice-notes',
          `${profile.id}/${Date.now()}.m4a`,
          'audio/m4a'
        );
      }

      await addTransaction({ owner_id: profile.id, amount, type, voice_note_url });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('transactionEntry.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const displayAmount = formatDigits(amountStr || '0');

  return (
    <View style={styles.container}>
      {/* Type toggle */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'owes' && styles.typeButtonActiveRed]}
          onPress={() => setType('owes')}
          activeOpacity={0.8}
        >
          <Text style={[styles.typeButtonText, type === 'owes' && styles.typeButtonTextRed]}>
            {t('transactionEntry.owe')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'paid' && styles.typeButtonActiveGreen]}
          onPress={() => setType('paid')}
          activeOpacity={0.8}
        >
          <Text style={[styles.typeButtonText, type === 'paid' && styles.typeButtonTextGreen]}>
            {t('transactionEntry.paid')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount display */}
      <View style={styles.amountDisplay}>
        <Text style={[styles.amountText, type === 'owes' ? styles.amountRed : styles.amountGreen]}>
          ৳{displayAmount}
        </Text>
      </View>

      {/* Voice note */}
      <View style={styles.voiceRow}>
        <VoiceRecorder onRecorded={setVoiceNoteUri} existingUri={voiceNoteUri} label={t('transactionEntry.recordNote')} />
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        <NumericKeypad
          onPress={handleKey}
          onBackspace={handleBackspace}
          showMic={false}
        />
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, type === 'owes' ? styles.saveButtonRed : styles.saveButtonGreen]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{t('transactionEntry.submit')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActiveRed: { borderColor: '#D32F2F', backgroundColor: '#FFEBEE' },
  typeButtonActiveGreen: { borderColor: '#388E3C', backgroundColor: '#E8F5E9' },
  typeButtonText: { fontSize: 16, fontWeight: '500', color: '#757575' },
  typeButtonTextRed: { color: '#D32F2F' },
  typeButtonTextGreen: { color: '#388E3C' },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  amountText: { fontSize: 48, fontWeight: '500' },
  amountRed: { color: '#D32F2F' },
  amountGreen: { color: '#388E3C' },
  voiceRow: { alignItems: 'center', marginBottom: 16 },
  keypadContainer: { marginBottom: 16 },
  saveButton: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonRed: { backgroundColor: '#D32F2F' },
  saveButtonGreen: { backgroundColor: '#388E3C' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' },
});
