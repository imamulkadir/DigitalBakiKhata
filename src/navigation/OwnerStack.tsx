import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/owner/HomeScreen';
import AddCustomerScreen from '../screens/owner/AddCustomerScreen';
import CustomerDetailScreen from '../screens/owner/CustomerDetailScreen';
import EditCustomerScreen from '../screens/owner/EditCustomerScreen';
import TransactionEntryScreen from '../screens/owner/TransactionEntryScreen';
import SubscriptionScreen from '../screens/owner/SubscriptionScreen';
import AccountScreen from '../screens/owner/AccountScreen';
import AccountMenuButton from '../components/AccountMenuButton';
import type { Profile } from '../hooks/useAuth';

export type OwnerStackParamList = {
  Home: undefined;
  AddCustomer: undefined;
  CustomerDetail: { customerId: string };
  EditCustomer: { customerId: string };
  TransactionEntry: { customerId: string };
  Subscription: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();

interface Props {
  profile: Profile;
  onLogout: () => void;
  onProfileUpdate: (profile: Profile) => void;
}

export default function OwnerStack({ profile, onLogout, onProfileUpdate }: Props) {
  function confirmLogout() {
    Alert.alert('লগআউট', 'আপনি কি লগআউট করতে চান?', [
      { text: 'না', style: 'cancel' },
      { text: 'হ্যাঁ', style: 'destructive', onPress: onLogout },
    ]);
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#D32F2F',
        headerTitleStyle: { fontWeight: '500', fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="Home"
        options={({ navigation }) => ({
          title: 'বাকি খাতা',
          headerRight: () => (
            <AccountMenuButton
              photoUrl={profile.owner_photo_url}
              onAccountPress={() => navigation.navigate('Account')}
              onLogoutPress={confirmLogout}
            />
          ),
        })}
      >
        {(props) => <HomeScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="AddCustomer" options={{ title: 'নতুন গ্রাহক' }}>
        {(props) => <AddCustomerScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen
        name="CustomerDetail"
        options={({ navigation, route }) => ({
          title: 'গ্রাহকের হিসাব',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('EditCustomer', { customerId: route.params.customerId })}>
              <Text style={{ color: '#1565C0', fontSize: 14 }}>✎ সম্পাদনা</Text>
            </TouchableOpacity>
          ),
        })}
      >
        {(props) => <CustomerDetailScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="EditCustomer" options={{ title: 'গ্রাহক সম্পাদনা' }} component={EditCustomerScreen} />
      <Stack.Screen name="TransactionEntry" options={{ title: 'লেনদেন' }}>
        {(props) => <TransactionEntryScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="Subscription" options={{ title: 'সাবস্ক্রিপশন' }}>
        {(props) => <SubscriptionScreen profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="Account" options={{ title: 'অ্যাকাউন্ট' }}>
        {(props) => <AccountScreen {...props} profile={profile} onProfileUpdate={onProfileUpdate} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
