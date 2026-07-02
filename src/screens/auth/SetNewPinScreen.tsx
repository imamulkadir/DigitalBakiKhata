import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { setNewPin } from '../../hooks/useAuth';
import PinInput from '../../components/PinInput';
import AuthHeader from '../../components/AuthHeader';
import AuthLanguageCorner from '../../components/AuthLanguageCorner';
import { useTranslation } from '../../i18n/LanguageContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SetNewPin'>;
  route: RouteProp<AuthStackParamList, 'SetNewPin'>;
};

export default function SetNewPinScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { phone } = route.params;
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
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
      result = await setNewPin(phone, pin);
    } catch {
      setLoading(false);
      setError(t('common.networkError'));
      return;
    }
    setLoading(false);

    if ('error' in result) {
      setError(result.error);
      return;
    }

    Alert.alert(t('setNewPin.successTitle'), t('setNewPin.successMessage'), [
      { text: t('common.close'), onPress: () => navigation.replace('Login') },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <AuthLanguageCorner />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AuthHeader />

          <Text style={styles.screenSubtitle}>{t('setNewPin.subtitle')}</Text>

          <PinInput value={pin} onChange={setPin} secureTextEntry />
          <PinInput value={confirmPin} onChange={setConfirmPin} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('setNewPin.submit')}</Text>}
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
});
