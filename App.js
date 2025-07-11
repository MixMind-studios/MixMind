import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PurchaseProvider } from './contexts/PurchaseContext';
import AuthScreen from './screens/AuthScreen';
import InventoryScreen from './screens/InventoryScreen';
import AIGeneratorScreen from './screens/AIGeneratorScreen';
import PhotoAnalysisScreen from './screens/PhotoAnalysisScreen';
import RecipesScreen from './screens/RecipesScreen';
import ProfileScreen from './screens/ProfileScreen';
import PremiumUpgradeScreen from './screens/PremiumUpgradeScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inventory') {
            iconName = focused ? 'archive' : 'archive-outline';
          } else if (route.name === 'AI Generator') {
            iconName = focused ? 'brain' : 'brain-outline';
          } else if (route.name === 'Photo Analysis') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Recipes') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
        },
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="AI Generator" component={AIGeneratorScreen} />
      <Tab.Screen name="Photo Analysis" component={PhotoAnalysisScreen} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1F2937',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PremiumUpgrade" 
          component={PremiumUpgradeScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PurchaseProvider>
        <AppNavigator />
      </PurchaseProvider>
    </AuthProvider>
  );
}
