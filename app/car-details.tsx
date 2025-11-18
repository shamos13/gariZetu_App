import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { carService } from '@/database/carService';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Car } from '@/types/car';

export default function CarDetailsScreen() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const borderColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const primaryActionColor = useThemeColor({ light: '#0a7ea4', dark: '#4DB6AC' }, 'tint');
  const primaryActionText = useThemeColor({ light: '#FFFFFF', dark: '#0B0F10' }, 'text');

  useEffect(() => {
    const loadCar = async () => {
      if (!carId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const carData = await carService.findById(carId);
        setCar(carData);
      } catch (error) {
        console.error('Error loading car:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCar();
  }, [carId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading car details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={[styles.content, styles.centerContent]}>
          <ThemedText>Car not found</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={{ color: tintColor, marginTop: 16 }}>Go Back</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backButtonText, { color: tintColor }]}>← Back</ThemedText>
          </Pressable>

          <Image source={{ uri: car.image }} style={styles.image} contentFit="cover" />

          <View style={styles.detailsContainer}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <ThemedText type="title" style={styles.carName}>
                  {car.name}
                </ThemedText>
                <ThemedText style={styles.model}>{car.model} • {car.type}</ThemedText>
              </View>
              <View style={[styles.typeBadge, { borderColor }]}>
                <ThemedText style={styles.typeText}>{car.type}</ThemedText>
              </View>
            </View>

            <View style={[styles.priceSection, { borderColor: borderColor + '30' }]}>
              <View>
                <ThemedText style={styles.priceLabel}>Price per day</ThemedText>
                <View style={styles.priceContainer}>
                  <ThemedText type="defaultSemiBold" style={styles.price}>
                    Ksh {car.pricePerDay.toLocaleString('en-KE')}
                  </ThemedText>
                  <ThemedText style={styles.priceUnit}>/day</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Description
              </ThemedText>
              <ThemedText style={styles.description}>{car.description}</ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Specifications
              </ThemedText>
              <View style={styles.specsContainer}>
                <View style={[styles.specItem, { borderColor: borderColor + '30' }]}>
                  <ThemedText style={styles.specLabel}>Capacity</ThemedText>
                  <ThemedText type="defaultSemiBold">{car.capacity} seats</ThemedText>
                </View>
                <View style={[styles.specItem, { borderColor: borderColor + '30' }]}>
                  <ThemedText style={styles.specLabel}>Transmission</ThemedText>
                  <ThemedText type="defaultSemiBold">{car.transmission}</ThemedText>
                </View>
                <View style={[styles.specItem, { borderColor: borderColor + '30' }]}>
                  <ThemedText style={styles.specLabel}>Type</ThemedText>
                  <ThemedText type="defaultSemiBold">{car.type}</ThemedText>
                </View>
                <View style={[styles.specItem, { borderColor: borderColor + '30' }]}>
                  <ThemedText style={styles.specLabel}>Status</ThemedText>
                  <ThemedText type="defaultSemiBold" style={{ color: '#4CAF50' }}>
                    {car.available ? 'Available' : 'Unavailable'}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Features
              </ThemedText>
              <View style={styles.featuresContainer}>
                {car.features.map((feature, index) => (
                  <View
                    key={index}
                    style={[styles.featureTag, { backgroundColor: borderColor + '20', borderColor }]}>
                    <ThemedText style={styles.featureText}>{feature}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              style={[
                styles.bookButton,
                {
                  backgroundColor: primaryActionColor,
                  shadowColor: primaryActionColor,
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/booking/new',
                  params: { carId: car.id },
                })
              }>
              <ThemedText style={[styles.bookButtonText, { color: primaryActionText }]}>
                Reserve (Dev)
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  backButton: {
    padding: 16,
    paddingBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 300,
  },
  detailsContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  carName: {
    marginBottom: 4,
  },
  model: {
    fontSize: 16,
    opacity: 0.7,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  priceUnit: {
    fontSize: 16,
    marginLeft: 4,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  specLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 14,
  },
  bookButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

