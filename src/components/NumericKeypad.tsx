import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDigits } from '../utils/currencyFormat';

interface Props {
  onPress: (key: string) => void;
  onBackspace: () => void;
  onMic?: () => void;
  showMic?: boolean;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['mic', '0', 'back'],
];

export default function NumericKeypad({ onPress, onBackspace, onMic, showMic = false }: Props) {
  return (
    <View style={styles.container}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key) => {
            if (key === 'back') {
              return (
                <TouchableOpacity
                  key="back"
                  style={styles.key}
                  onPress={onBackspace}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyIcon}>⌫</Text>
                </TouchableOpacity>
              );
            }
            if (key === 'mic') {
              return (
                <TouchableOpacity
                  key="mic"
                  style={[styles.key, !showMic && styles.keyDisabled]}
                  onPress={showMic ? onMic : undefined}
                  activeOpacity={showMic ? 0.7 : 1}
                >
                  <Text style={[styles.keyIcon, !showMic && styles.keyIconDisabled]}>🎤</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={key}
                style={styles.key}
                onPress={() => onPress(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{formatDigits(key)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  key: {
    flex: 1,
    marginHorizontal: 4,
    height: 64,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: {
    backgroundColor: '#EBEBEB',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  keyIcon: {
    fontSize: 22,
    color: '#1A1A1A',
  },
  keyIconDisabled: {
    color: '#BBBBBB',
  },
});
