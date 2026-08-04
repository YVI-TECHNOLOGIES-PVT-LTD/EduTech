import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const OfflineBanner: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ You are in Offline Mode. Displaying cached data.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#b91c1c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
