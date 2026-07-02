import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  onRecorded: (uri: string) => void;
  existingUri?: string | null;
  label?: string;
}

export default function VoiceRecorder({ onRecorded, existingUri, label }: Props) {
  const { t } = useTranslation();
  const displayLabel = label ?? t('addCustomer.recordName');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(existingUri ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (e) {
      console.error('Recording error', e);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        setRecordedUri(uri);
        onRecorded(uri);
      }
    } catch (e) {
      console.error('Stop recording error', e);
    } finally {
      // Always clear, even if stopAndUnloadAsync throws — otherwise the
      // native recording object is left dangling and every future
      // start/stop tap silently no-ops.
      setRecording(null);
      setIsRecording(false);
    }
  }

  async function playRecording() {
    if (!recordedUri || isPlaying) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
      soundRef.current = sound;
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (e) {
      setIsPlaying(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{isRecording ? t('voiceRecorder.stop') : `🎤 ${displayLabel}`}</Text>
      </TouchableOpacity>

      {recordedUri && (
        <TouchableOpacity style={styles.playButton} onPress={playRecording} activeOpacity={0.8}>
          {isPlaying ? (
            <ActivityIndicator size="small" color="#1565C0" />
          ) : (
            <Text style={styles.playText}>{t('voiceRecorder.listen')}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 30,
  },
  buttonRecording: {
    backgroundColor: '#FFEBEE',
  },
  buttonText: {
    fontSize: 15,
    color: '#1565C0',
    fontWeight: '500',
  },
  playButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    minWidth: 80,
    alignItems: 'center',
  },
  playText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
});
