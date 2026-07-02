import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SetNewPinScreen from '../screens/auth/SetNewPinScreen';
import type { Profile } from '../hooks/useAuth';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PendingApproval: { phone: string };
  SetNewPin: { phone: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface Props {
  onLogin: (profile: Profile, token: string) => void;
}

export default function AuthStack({ onLogin }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="SetNewPin" component={SetNewPinScreen} />
    </Stack.Navigator>
  );
}
