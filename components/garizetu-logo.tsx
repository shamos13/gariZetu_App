import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface GarizetuLogoProps {
  size?: number;
}

export function GarizetuLogo({ size = 40 }: GarizetuLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('@/assets/images/logo.jpeg')}
        style={[styles.logoImage, { width: size, height: size }]}
        contentFit="contain"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  logoImage: {
    borderRadius: 20,
  },
});
