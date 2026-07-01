import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import OwnerStack from './OwnerStack';
import AdminStack from './AdminStack';
import { loadSession, clearSession, Profile } from '../hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

export default function RootNavigator() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await loadSession();
      if (session) {
        setProfile(session.profile);
        setToken(session.token);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const pushToken = tokenData.data;
        if (pushToken && pushToken !== profile.expo_push_token) {
          await supabase
            .from('profiles')
            .update({ expo_push_token: pushToken })
            .eq('id', profile.id);
        }
      }
    })();
  }, [profile?.id]);

  function handleLogin(p: Profile, t: string) {
    setProfile(p);
    setToken(t);
  }

  async function handleLogout() {
    await clearSession();
    setProfile(null);
    setToken(null);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!profile ? (
        <AuthStack onLogin={handleLogin} />
      ) : profile.role === 'super_admin' ? (
        <AdminStack profile={profile} token={token!} onLogout={handleLogout} />
      ) : (
        <OwnerStack profile={profile} onLogout={handleLogout} />
      )}
    </NavigationContainer>
  );
}
