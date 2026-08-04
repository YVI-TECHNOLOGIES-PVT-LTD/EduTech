import React from 'react';
import { Stack } from 'expo-router';

export default function CommonLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="notifications" />
      <Stack.Screen name="no-internet" />
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="unexpected-error" />
    </Stack>
  );
}
