import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, ScrollView, TextInput, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OwnerStackParamList } from '../../navigation/OwnerStack';
import VoiceRecorder from '../../components/VoiceRecorder';
import { useCustomers } from '../../hooks/useCustomers';
import { supabase } from '../../lib/supabase';
import { uploadFile } from '../../utils/uploadFile';
import { compressImage } from '../../utils/compressImage';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatNumber } from '../../utils/currencyFormat';
import type { Profile } from '../../hooks/useAuth';

type Props = {
  navigation: NativeStackNavigationProp<OwnerStackParamList, 'AddCustomer'>;
  profile: Profile;
};

export default function AddCustomerScreen({ navigation, profile }: Props) {
  const { t } = useTranslation();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const { addCustomer } = useCustomers(profile.id);

  useEffect(() => {
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', profile.id)
      .then(({ count }) => setCustomerCount(count ?? 0));
  }, [profile.id]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('addCustomer.cameraPermissionTitle'), t('addCustomer.cameraPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      let photo_url: string | undefined;
      let voice_tag_url: string | undefined;

      if (photoUri) {
        const compressedUri = await compressImage(photoUri);
        photo_url = await uploadFile(
          compressedUri,
          'customer-photos',
          `${profile.id}/${Date.now()}.jpg`,
          'image/jpeg'
        );
      }
      if (voiceUri) {
        voice_tag_url = await uploadFile(
          voiceUri,
          'voice-tags',
          `${profile.id}/${Date.now()}.m4a`,
          'audio/m4a'
        );
      }

      const nextNum = (customerCount ?? 0) + 1;
      const fallback_label = `${t('addCustomer.autoNamePrefix')} ${formatNumber(nextNum)}`;

      await addCustomer({
        photo_url,
        voice_tag_url,
        fallback_label,
        phone_number: customerPhone || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('addCustomer.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{t('addCustomer.heading')}</Text>

      {/* Photo capture */}
      <TouchableOpacity style={styles.photoTarget} onPress={pickPhoto} activeOpacity={0.8}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.photoHint}>{t('addCustomer.photoHint')}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Voice tag */}
      <View style={styles.section}>
        <VoiceRecorder onRecorded={setVoiceUri} existingUri={voiceUri} label={t('addCustomer.recordName')} />
      </View>

      {/* Optional phone number */}
      <TextInput
        style={styles.input}
        placeholder={t('addCustomer.phonePlaceholder')}
        keyboardType="phone-pad"
        value={customerPhone}
        onChangeText={setCustomerPhone}
        maxLength={14}
      />

      {!photoUri && !voiceUri && customerCount !== null && (
        <Text style={styles.hint}>
          {t('addCustomer.autoNameHint', { n: formatNumber(customerCount + 1) })}
        </Text>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('addCustomer.submit')}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 24, alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '500', color: '#1A1A1A', marginBottom: 24, alignSelf: 'flex-start' },
  photoTarget: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { width: 160, height: 160 },
  photoPlaceholder: { alignItems: 'center', padding: 20 },
  cameraIcon: { fontSize: 40, marginBottom: 8 },
  photoHint: { fontSize: 13, color: '#757575', textAlign: 'center' },
  section: { width: '100%', marginBottom: 20 },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#1A1A1A',
  },
  hint: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#388E3C',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' },
});
