import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import StatusPill from '../../components/StatusPill';
import LanguageToggleCompact from '../../components/LanguageToggleCompact';
import { useProfile } from '../../hooks/useProfile';
import { uploadFile } from '../../utils/uploadFile';
import { compressImage } from '../../utils/compressImage';
import { formatDate } from '../../utils/dateRelative';
import { useTranslation } from '../../i18n/LanguageContext';
import type { Profile } from '../../hooks/useAuth';

interface Props {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
}

export default function AccountScreen({ profile, onProfileUpdate }: Props) {
  const { t } = useTranslation();
  const { saving, error, updateProfile } = useProfile(profile);
  const [ownerName, setOwnerName] = useState(profile.owner_name ?? '');
  const [shopName, setShopName] = useState(profile.shop_name ?? '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const dirty = ownerName !== (profile.owner_name ?? '') || shopName !== (profile.shop_name ?? '');

  async function handlePickPhoto() {
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
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const compressedUri = await compressImage(result.assets[0].uri);
      const url = await uploadFile(
        compressedUri,
        'customer-photos',
        `${profile.id}/owner_avatar_${Date.now()}.jpg`,
        'image/jpeg'
      );
      const updated = await updateProfile({ owner_photo_url: url });
      if (updated) onProfileUpdate(updated);
    } catch {
      Alert.alert(t('common.error'), t('account.photoUploadError'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    const updated = await updateProfile({ owner_name: ownerName, shop_name: shopName });
    if (updated) {
      onProfileUpdate(updated);
      Alert.alert(t('account.saved'), t('account.savedMessage'));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.8}>
        {uploadingPhoto ? (
          <View style={styles.avatarPlaceholder}><ActivityIndicator color="#D32F2F" /></View>
        ) : profile.owner_photo_url ? (
          <Image source={{ uri: profile.owner_photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        )}
        <View style={styles.cameraBadge}>
          <Text style={{ fontSize: 12 }}>📷</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('account.language')}</Text>
        <LanguageToggleCompact />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('account.ownerInfo')}</Text>

        <Text style={styles.fieldLabel}>{t('account.ownerNameLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('account.ownerNamePlaceholder')}
          value={ownerName}
          onChangeText={setOwnerName}
          maxLength={80}
        />

        <Text style={styles.fieldLabel}>{t('account.shopNameLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('account.shopNamePlaceholder')}
          value={shopName}
          onChangeText={setShopName}
          maxLength={80}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {dirty && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('common.save')}</Text>}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('account.accountInfo')}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>{t('account.phoneNumber')}</Text>
          <Text style={styles.value}>{profile.phone_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account.subscription')}</Text>
          <StatusPill status={(profile.subscription_status ?? 'active') as any} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account.createdAt')}</Text>
          <Text style={styles.value}>{formatDate(profile.created_at)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account.lastPaid')}</Text>
          <Text style={styles.value}>{profile.last_paid_date ? formatDate(profile.last_paid_date) : t('account.none')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account.nextDue')}</Text>
          <Text style={styles.value}>{profile.next_due_date ? formatDate(profile.next_due_date) : t('account.none')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginVertical: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 48 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 6,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginBottom: 16, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: '#757575', marginBottom: 6 },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#388E3C', borderRadius: 30,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  label: { fontSize: 14, color: '#757575' },
  value: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  error: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 8 },
});
