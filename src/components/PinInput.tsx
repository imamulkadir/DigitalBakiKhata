import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toEnglishDigits } from '../utils/phoneValidation';

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  secureTextEntry?: boolean;
}

export default function PinInput({ length = 6, value, onChange, secureTextEntry }: Props) {
  const [revealed, setRevealed] = useState(!secureTextEntry);

  function handleChange(text: string) {
    onChange(toEnglishDigits(text).replace(/\D/g, '').slice(0, length));
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        secureTextEntry={secureTextEntry && !revealed}
      />
      {secureTextEntry ? (
        <TouchableOpacity style={styles.eyeButton} onPress={() => setRevealed((v) => !v)} activeOpacity={0.7}>
          <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color="#757575" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 48,
    fontSize: 20,
    letterSpacing: 8,
    color: '#1A1A1A',
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
