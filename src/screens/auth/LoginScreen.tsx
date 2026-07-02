import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import {
  loginUser, saveSession, saveLastPhoneNumber, loadLastPhoneNumber,
  saveRememberedPin, loadRememberedPin, clearRememberedPin, Profile,
} from '../../hooks/useAuth';
import { isValidBDPhone, toEnglishDigits } from '../../utils/phoneValidation';
import PinInput from '../../components/PinInput';
import AuthHeader from '../../components/AuthHeader';
import AuthLanguageCorner from '../../components/AuthLanguageCorner';
import { useTranslation } from '../../i18n/LanguageContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
  onLogin: (profile: Profile, token: string) => void;
};

export default function LoginScreen({ navigation, onLogin }: Props) {
  const { t } = useTranslation();
  const [localNumber, setLocalNumber] = useState('');
  const [pin, setPin] = useState('');
  const [rememberPin, setRememberPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const phone = `+880${localNumber}`;

  useEffect(() => {
    loadLastPhoneNumber().then((saved) => { if (saved) setLocalNumber(saved); });
    loadRememberedPin().then((saved) => {
      if (saved) {
        setPin(saved);
        setRememberPin(true);
      }
    });
  }, []);

  async function handleLogin() {
    setError('');
    if (!isValidBDPhone(phone)) {
      setError(t('login.invalidPhone'));
      return;
    }
    if (pin.length !== 6) {
      setError(t('login.pinLengthError'));
      return;
    }

    setLoading(true);
    let result;
    try {
      result = await loginUser(phone, pin);
    } catch {
      setLoading(false);
      setError(t('common.networkError'));
      return;
    }
    setLoading(false);

    if ('error' in result) {
      if ((result as any).status === 'pending_approval') {
        navigation.replace('PendingApproval', { phone });
      } else if ((result as any).status === 'pin_reset_required') {
        await clearRememberedPin();
        navigation.replace('SetNewPin', { phone });
      } else {
        setError((result as any).error ?? t('login.loginFailed'));
      }
      return;
    }

    const { profile, access_token } = result as { profile: Profile; access_token: string };
    await saveSession(access_token, profile);
    await saveLastPhoneNumber(localNumber);
    if (rememberPin) {
      await saveRememberedPin(pin);
    } else {
      await clearRememberedPin();
    }
    onLogin(profile, access_token);
  }

  return (
    <View style={{ flex: 1 }}>
      <AuthLanguageCorner />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AuthHeader />

          <Text style={styles.screenSubtitle}>{t('login.subtitle')}</Text>

          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+880</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('login.phonePlaceholder')}
              keyboardType="number-pad"
              value={localNumber}
              onChangeText={(val) => setLocalNumber(toEnglishDigits(val).replace(/\D/g, '').slice(0, 10))}
              autoComplete="tel"
              maxLength={10}
            />
          </View>

          <PinInput value={pin} onChange={setPin} secureTextEntry />

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberPin((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberPin && styles.checkboxChecked]}>
              {rememberPin ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
            </View>
            <Text style={styles.rememberText}>{t('login.rememberPin')}</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('login.submit')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('Register')} style={styles.link}>
            <Text style={styles.linkText}>{t('login.registerLink')}</Text>
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#1B8A5A',
    borderColor: '#1B8A5A',
  },
  rememberText: {
    fontSize: 14,
    color: '#4A4A4A',
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
