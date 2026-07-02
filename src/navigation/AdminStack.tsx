import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import LanguageToggleCompact from '../components/LanguageToggleCompact';
import { useTranslation } from '../i18n/LanguageContext';
import type { Profile } from '../hooks/useAuth';

export type AdminStackParamList = {
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

interface Props {
  profile: Profile;
  token: string;
  onLogout: () => void;
}

export default function AdminStack({ profile, token, onLogout }: Props) {
  const { t } = useTranslation();

  function confirmLogout() {
    Alert.alert(t('admin.logoutConfirmTitle'), t('admin.logoutConfirmMessage'), [
      { text: t('admin.logoutNo'), style: 'cancel' },
      { text: t('admin.logoutYes'), style: 'destructive', onPress: onLogout },
    ]);
  }

  const headerRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <LanguageToggleCompact />
      <TouchableOpacity onPress={confirmLogout} style={{ paddingHorizontal: 4 }}>
        <Text style={{ color: '#757575', fontSize: 14 }}>{t('admin.logout')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#D32F2F',
        headerTitleStyle: { fontWeight: '500', fontSize: 18 },
      }}
    >
      <Stack.Screen name="AdminDashboard" options={{ title: t('admin.dashboardTitle'), headerRight }}>
        {() => <AdminDashboardScreen profile={profile} token={token} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
