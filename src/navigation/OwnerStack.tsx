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
import HeaderTriggerIcons from '../components/HeaderTriggerIcons';
import { HeaderMenuProvider } from '../context/HeaderMenuContext';
import { useTranslation } from '../i18n/LanguageContext';
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
  const { t } = useTranslation();

  function confirmLogout() {
    Alert.alert(t('admin.logoutConfirmTitle'), t('admin.logoutConfirmMessage'), [
      { text: t('admin.logoutNo'), style: 'cancel' },
      { text: t('admin.logoutYes'), style: 'destructive', onPress: onLogout },
    ]);
  }

  return (
    <HeaderMenuProvider ownerId={profile.id}>
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
          title: t('home.title'),
          headerRight: () => <HeaderTriggerIcons photoUrl={profile.owner_photo_url} />,
        })}
      >
        {(props) => (
          <HomeScreen
            {...props}
            profile={profile}
            onAccountPress={() => props.navigation.navigate('Account')}
            onLogoutPress={confirmLogout}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="AddCustomer" options={{ title: t('addCustomer.heading') }}>
        {(props) => <AddCustomerScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen
        name="CustomerDetail"
        options={({ navigation, route }) => ({
          title: t('customerDetail.title'),
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('EditCustomer', { customerId: route.params.customerId })}>
              <Text style={{ color: '#1565C0', fontSize: 14 }}>{t('customerDetail.edit')}</Text>
            </TouchableOpacity>
          ),
        })}
      >
        {(props) => <CustomerDetailScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="EditCustomer" options={{ title: t('editCustomer.title') }} component={EditCustomerScreen} />
      <Stack.Screen name="TransactionEntry" options={{ title: t('transactionEntry.title') }}>
        {(props) => <TransactionEntryScreen {...props} profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="Subscription" options={{ title: t('subscription.title') }}>
        {(props) => <SubscriptionScreen profile={profile} />}
      </Stack.Screen>
      <Stack.Screen name="Account" options={{ title: t('account.title') }}>
        {(props) => <AccountScreen {...props} profile={profile} onProfileUpdate={onProfileUpdate} />}
      </Stack.Screen>
      </Stack.Navigator>
    </HeaderMenuProvider>
  );
}
