import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { loginUser, saveSession, saveLastPhoneNumber, loadLastPhoneNumber, Profile } from '../../hooks/useAuth';
import { isValidBDPhone, toEnglishDigits } from '../../utils/phoneValidation';
import PinInput from '../../components/PinInput';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
  onLogin: (profile: Profile, token: string) => void;
};

export default function LoginScreen({ navigation, onLogin }: Props) {
  const [localNumber, setLocalNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const phone = `+880${localNumber}`;

  useEffect(() => {
    loadLastPhoneNumber().then((saved) => { if (saved) setLocalNumber(saved); });
  }, []);

  async function handleLogin() {
    setError('');
    if (!isValidBDPhone(phone)) {
      setError('সঠিক বাংলাদেশি ফোন নম্বর দিন');
      return;
    }
    if (pin.length !== 6) {
      setError('PIN অবশ্যই ৬ সংখ্যার হতে হবে');
      return;
    }

    setLoading(true);
    let result;
    try {
      result = await loginUser(phone, pin);
    } catch {
      setLoading(false);
      setError('নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন');
      return;
    }
    setLoading(false);

    if ('error' in result) {
      if ((result as any).status === 'pending_approval') {
        navigation.replace('PendingApproval', { phone });
      } else {
        setError((result as any).error ?? 'লগইন করতে সমস্যা হয়েছে');
      }
      return;
    }

    const { profile, access_token } = result as { profile: Profile; access_token: string };
    await saveSession(access_token, profile);
    await saveLastPhoneNumber(localNumber);
    onLogin(profile, access_token);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>বাকি খাতা</Text>
        <Text style={styles.subtitle}>আপনার অ্যাকাউন্টে প্রবেশ করুন</Text>

        <View style={styles.phoneRow}>
          <View style={styles.phonePrefix}>
            <Text style={styles.phonePrefixText}>+880</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="1XXXXXXXXX"
            keyboardType="number-pad"
            value={localNumber}
            onChangeText={(t) => setLocalNumber(toEnglishDigits(t).replace(/\D/g, '').slice(0, 10))}
            autoComplete="tel"
            maxLength={10}
          />
        </View>

        <PinInput value={pin} onChange={setPin} secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>প্রবেশ করুন</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Register')} style={styles.link}>
          <Text style={styles.linkText}>নতুন অ্যাকাউন্ট খুলুন</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
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
    backgroundColor: '#D32F2F',
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
