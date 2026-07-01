import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/owner/HomeScreen';
import AddCustomerScreen from '../screens/owner/AddCustomerScreen';
import CustomerDetailScreen from '../screens/owner/CustomerDetailScreen';
import TransactionEntryScreen from '../screens/owner/TransactionEntryScreen';
import SubscriptionScreen from '../screens/owner/SubscriptionScreen';
import type { Profile } from '../hooks/useAuth';

export type OwnerStackParamList = {
  Home: undefined;
  AddCustomer: undefined;
  CustomerDetail: { customerId: string };
  TransactionEntry: { customerId: string };
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();

interface Props {
  profile: Profile;
  onLogout: () => void;
}

export default function OwnerStack({ profile, onLogout }: Props) {
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
      <Stack.Screen name="Home" options={{ title: 'বাকি খাতা', headerRight }}>
        {(props) => <HomeScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="AddCustomer" options={{ title: 'নতুন গ্রাহক' }}>
        {(props) => <AddCustomerScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="CustomerDetail" options={{ title: 'গ্রাহকের হিসাব' }}>
        {(props) => <CustomerDetailScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="TransactionEntry" options={{ title: 'লেনদেন' }}>
        {(props) => <TransactionEntryScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="Subscription" options={{ title: 'সাবস্ক্রিপশন' }}>
        {(props) => <SubscriptionScreen profile={profile} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
