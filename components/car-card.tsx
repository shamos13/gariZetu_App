import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Car } from '@/types/car';

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const borderColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({ light: '#F5F5F5', dark: '#1E1E1E' }, 'background');

  const handlePress = () => {
    router.push({
      pathname: '/car-details',
      params: { carId: car.id },
    });
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <ThemedView style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
        <Image
          source={{ uri: car.image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <ThemedText type="defaultSemiBold" style={styles.carName}>
                {car.name}
              </ThemedText>
              <ThemedText style={styles.model}>{car.model}</ThemedText>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: borderColor }]}>
              <ThemedText style={styles.typeText}>{car.type}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.description} numberOfLines={2}>
            {car.description}
          </ThemedText>
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <ThemedText type="defaultSemiBold" style={styles.price}>
                ${car.pricePerDay}
              </ThemedText>
              <ThemedText style={styles.priceLabel}>/day</ThemedText>
            </View>
            <View style={styles.featuresContainer}>
              <ThemedText style={styles.feature}>
                {car.capacity} seats • {car.transmission}
              </ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  carName: {
    fontSize: 18,
    marginBottom: 4,
  },
  model: {
    fontSize: 14,
    opacity: 0.7,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    opacity: 0.2,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceLabel: {
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.7,
  },
  featuresContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  feature: {
    fontSize: 12,
    opacity: 0.7,
  },
});

