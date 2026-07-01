import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PendingApproval'>;
  route: RouteProp<AuthStackParamList, 'PendingApproval'>;
};

export default function PendingApprovalScreen({ navigation, route }: Props) {
  const [checking, setChecking] = useState(false);

  async function handleRefresh() {
    setChecking(true);
    // Navigate to Login; the login screen will surface the correct status message
    setTimeout(() => {
      setChecking(false);
      navigation.replace('Login');
    }, 1000);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>অনুমোদনের অপেক্ষায়</Text>
      <Text style={styles.message}>
        আপনার অ্যাকাউন্ট যাচাই করা হচ্ছে। অনুমোদনের পর আপনি লগইন করতে পারবেন।
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleRefresh} disabled={checking} activeOpacity={0.85}>
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>রিফ্রেশ করুন</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.link}>
        <Text style={styles.linkText}>লগইন করুন</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1565C0',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#1565C0',
    fontSize: 15,
  },
});
