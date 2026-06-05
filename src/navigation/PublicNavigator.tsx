import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { AuthPromptScreen } from '../screens/auth/AuthPromptScreen';
import { CarDetailScreen } from '../screens/client/CarDetailScreen';
import { DriverDetailScreen } from '../screens/client/DriverDetailScreen';
import { DriverListScreen } from '../screens/client/DriverListScreen';
import { PublicTabNavigator } from './PublicTabNavigator';
import type { PublicStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerStyle: { backgroundColor: '#f8fafc' },
        headerShadowVisible: false,
        headerTintColor: '#0f172a',
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="PublicTabs" component={PublicTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CarDetail" component={CarDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DriverList" component={DriverListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DriverDetail" component={DriverDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Booking" component={AuthPromptScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AuthPrompt" component={AuthPromptScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
