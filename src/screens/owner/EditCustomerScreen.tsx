import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OwnerStackParamList } from '../../navigation/OwnerStack';
import { getCustomerDetail, updateCustomer } from '../../hooks/useCustomers';
import { toEnglishDigits } from '../../utils/phoneValidation';
import { useTranslation } from '../../i18n/LanguageContext';

type Props = {
  navigation: NativeStackNavigationProp<OwnerStackParamList, 'EditCustomer'>;
  route: RouteProp<OwnerStackParamList, 'EditCustomer'>;
};

export default function EditCustomerScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { customerId } = route.params;
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [localNumber, setLocalNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await getCustomerDetail(customerId);
        setName(data.name ?? '');
        setAddress(data.address ?? '');
        const phone: string | null = data.phone_number;
        setLocalNumber(phone?.startsWith('+880') ? phone.slice(4) : '');
      } catch {
        Alert.alert(t('common.error'), t('editCustomer.loadError'));
      } finally {
        setLoadingCustomer(false);
      }
    })();
  }, [customerId]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCustomer(customerId, {
        name: name || undefined,
        address: address || undefined,
        phone_number: localNumber ? `+880${localNumber}` : undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('editCustomer.saveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loadingCustomer) {
    return <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 60 }} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.fieldLabel}>{t('editCustomer.nameLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('editCustomer.namePlaceholder')}
        value={name}
        onChangeText={setName}
        maxLength={80}
      />

      <Text style={styles.fieldLabel}>{t('editCustomer.addressLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('editCustomer.addressPlaceholder')}
        value={address}
        onChangeText={setAddress}
        maxLength={200}
        multiline
      />

      <Text style={styles.fieldLabel}>{t('editCustomer.phoneLabel')}</Text>
      <View style={styles.phoneRow}>
        <View style={styles.phonePrefix}>
          <Text style={styles.phonePrefixText}>+880</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder={t('editCustomer.phonePlaceholder')}
          keyboardType="number-pad"
          value={localNumber}
          onChangeText={(val) => setLocalNumber(toEnglishDigits(val).replace(/\D/g, '').slice(0, 10))}
          maxLength={10}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('common.save')}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 24 },
  fieldLabel: { fontSize: 13, color: '#757575', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
    color: '#1A1A1A',
  },
  phoneRow: { flexDirection: 'row', marginBottom: 18 },
  phonePrefix: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginRight: 8,
    justifyContent: 'center',
  },
  phonePrefixText: { fontSize: 16, color: '#1A1A1A', fontWeight: '500' },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#388E3C',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' },
});
