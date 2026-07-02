import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';

interface Props {
  accentColor?: string;
}

export default function LanguageToggleCompact({ accentColor = '#D32F2F' }: Props) {
  const { language, setLanguage, t } = useTranslation();

  function Segment({ lang }: { lang: Language }) {
    const active = language === lang;
    return (
      <TouchableOpacity
        style={[styles.segment, active && styles.segmentActive]}
        onPress={() => setLanguage(lang)}
        activeOpacity={0.7}
      >
        <Text style={[styles.segmentText, active && { color: accentColor }]}>
          {lang === 'bn' ? t('languageToggle.bn') : t('languageToggle.en')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.row}>
      <Segment lang="bn" />
      <Segment lang="en" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 17,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
});
