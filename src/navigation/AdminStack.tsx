import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
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
  function confirmLogout() {
    Alert.alert('লগআউট', 'আপনি কি লগআউট করতে চান?', [
      { text: 'না', style: 'cancel' },
      { text: 'হ্যাঁ', style: 'destructive', onPress: onLogout },
    ]);
  }

  const headerRight = () => (
    <TouchableOpacity onPress={confirmLogout} style={{ paddingHorizontal: 4 }}>
      <Text style={{ color: '#757575', fontSize: 14 }}>লগআউট</Text>
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#D32F2F',
        headerTitleStyle: { fontWeight: '500', fontSize: 18 },
      }}
    >
      <Stack.Screen name="AdminDashboard" options={{ title: 'অ্যাডমিন ড্যাশবোর্ড', headerRight }}>
        {() => <AdminDashboardScreen profile={profile} token={token} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
