import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';

export default function AuthHeader() {
  const { t, language } = useTranslation();
  const appNameFont = language === 'bn' ? 'BalooDa2_800ExtraBold' : 'Baloo2_800ExtraBold';
  return (
    <View style={styles.header}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={[styles.appName, { fontFamily: appNameFont }]}>{t('brand.appName')}</Text>
      <Text style={styles.tagline}>{t('brand.subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 44,
    paddingTop: 8,
  },
  logo: { width: 84, height: 84, borderRadius: 20, marginBottom: 10 },
  appName: { fontSize: 30, color: '#1B8A5A', marginBottom: 4, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: '#757575', textAlign: 'center' },
});
