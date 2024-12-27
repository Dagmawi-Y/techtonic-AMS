import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme, StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [fontsLoaded] = useFonts({
    'Ubuntu-Regular': require('../assets/fonts/Ubuntu-Regular.ttf'),
    'Ubuntu-Medium': require('../assets/fonts/Ubuntu-Medium.ttf'),
    'Ubuntu-Bold': require('../assets/fonts/Ubuntu-Bold.ttf'),
  });

  useEffect(() => {
    // Initialize Firebase Auth listener
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isLoading && fontsLoaded && hydrated) {
      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to the sign-in page.
        router.replace('/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect away from the sign-in page.
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments, isLoading, fontsLoaded, hydrated]);

  if (!fontsLoaded || isLoading || !hydrated) {
    return null;
  }

  return (
    <>
      <StatusBar
        backgroundColor={`${COLORS.primary}99`}
        translucent={true}
        barStyle="light-content"
      />
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontFamily: 'Ubuntu-Bold',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
