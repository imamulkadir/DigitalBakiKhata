import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { registerUser } from '../../hooks/useAuth';
import { isValidBDPhone, toEnglishDigits } from '../../utils/phoneValidation';
import PinInput from '../../components/PinInput';
import AuthHeader from '../../components/AuthHeader';
import AuthLanguageCorner from '../../components/AuthLanguageCorner';
import { useTranslation } from '../../i18n/LanguageContext';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [localNumber, setLocalNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const phone = `+880${localNumber}`;

  async function handleRegister() {
    setError('');
    if (!isValidBDPhone(phone)) {
      setError(t('register.invalidPhone'));
      return;
    }
    if (pin.length !== 6) {
      setError(t('register.pinLengthError'));
      return;
    }
    if (pin !== confirmPin) {
      setError(t('register.pinMismatch'));
      return;
    }

    setLoading(true);
    let result;
    try {
      result = await registerUser(phone, pin, shopName || undefined);
    } catch {
      setLoading(false);
      setError(t('common.networkError'));
      return;
    }
    setLoading(false);

    if ('error' in result) {
      if (result.error === 'এই নম্বরটি আগে থেকেই নিবন্ধিত') {
        setError(t('register.alreadyRegisteredHint'));
      } else {
        setError(result.error);
      }
      return;
    }

    if (result.status === 'pending_approval') {
      navigation.replace('PendingApproval', { phone });
    } else if (result.role === 'super_admin') {
      navigation.replace('Login');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <AuthLanguageCorner />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AuthHeader />

          <Text style={styles.screenSubtitle}>{t('register.subtitle')}</Text>

          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+880</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="1XXXXXXXXX"
              keyboardType="number-pad"
              value={localNumber}
              onChangeText={(val) => setLocalNumber(toEnglishDigits(val).replace(/\D/g, '').slice(0, 10))}
              autoComplete="tel"
              maxLength={10}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder={t('register.shopNamePlaceholder')}
            value={shopName}
            onChangeText={setShopName}
            maxLength={80}
          />

          <PinInput value={pin} onChange={setPin} secureTextEntry />
          <PinInput value={confirmPin} onChange={setConfirmPin} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('register.submit')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.link}>
            <Text style={styles.linkText}>{t('register.loginLink')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 14,
    color: '#1A1A1A',
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
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
  phonePrefixText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
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
  error: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1B8A5A',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#1565C0',
    fontSize: 15,
  },
});
