import React from 'react';
import { Stack } from 'expo-router';
import { AppProvider } from '../src/providers/AppProvider';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(common)" />
        <Stack.Screen name="(admission)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="(parent)" />
      </Stack>
    </AppProvider>
  );
}
