import React from 'react';
import { View, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AccountScreen from '../screens/owner/AccountScreen';
import LanguageToggleCompact from '../components/LanguageToggleCompact';
import AdminAccountTrigger from '../components/AdminAccountTrigger';
import { AdminMenuProvider } from '../context/AdminMenuContext';
import { useTranslation } from '../i18n/LanguageContext';
import type { Profile } from '../hooks/useAuth';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

interface Props {
  profile: Profile;
  token: string;
  onLogout: () => void;
  onProfileUpdate: (profile: Profile) => void;
}

export default function AdminStack({ profile, token, onLogout, onProfileUpdate }: Props) {
  const { t } = useTranslation();

  function confirmLogout() {
    Alert.alert(t('admin.logoutConfirmTitle'), t('admin.logoutConfirmMessage'), [
      { text: t('admin.logoutNo'), style: 'cancel' },
      { text: t('admin.logoutYes'), style: 'destructive', onPress: onLogout },
    ]);
  }

  return (
    <AdminMenuProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#D32F2F',
          headerTitleStyle: { fontWeight: '500', fontSize: 18 },
        }}
      >
        <Stack.Screen
          name="AdminDashboard"
          options={({ navigation }) => ({
            title: t('admin.dashboardTitle'),
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LanguageToggleCompact />
                <AdminAccountTrigger photoUrl={profile.owner_photo_url} />
              </View>
            ),
          })}
        >
          {(props) => (
            <AdminDashboardScreen
              {...props}
              profile={profile}
              token={token}
              onAccountPress={() => props.navigation.navigate('Account')}
              onLogoutPress={confirmLogout}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Account" options={{ title: t('account.title') }}>
          {(props) => <AccountScreen {...props} profile={profile} onProfileUpdate={onProfileUpdate} />}
        </Stack.Screen>
      </Stack.Navigator>
    </AdminMenuProvider>
  );
}
