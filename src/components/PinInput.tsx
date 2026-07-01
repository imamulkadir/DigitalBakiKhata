import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { toEnglishDigits } from '../utils/phoneValidation';

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  secureTextEntry?: boolean;
}

export default function PinInput({ length = 6, value, onChange, secureTextEntry }: Props) {
  const inputs = useRef<Array<TextInput | null>>([]);

  function handleChange(text: string, index: number) {
    const digit = toEnglishDigits(text).replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = digit;
    const next = chars.join('').trimEnd();
    onChange(next);
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: { nativeEvent: { key: string } }, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          style={styles.box}
          value={value[i] && value[i] !== ' ' ? value[i] : ''}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry={secureTextEntry}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  box: {
    width: 44,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 20,
    textAlign: 'center',
    color: '#1A1A1A',
  },
});
