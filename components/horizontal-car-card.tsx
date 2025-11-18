import { Car } from '@/types/car';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface HorizontalCarCardProps {
  car: Car;
}

export function HorizontalCarCard({ car }: HorizontalCarCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handlePress = () => {
    router.push({
      pathname: '/car-details',
      params: { carId: car.id },
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: car.image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <Pressable onPress={toggleFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#FF3B30' : '#FFF'}
          />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.carName}>{car.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FF9500" />
          <Text style={styles.rating}>5.0</Text>
        </View>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.location}>Chicago, USA</Text>
        </View>
        <View style={styles.capacityContainer}>
          <Ionicons name="people-outline" size={14} color="#666" />
          <Text style={styles.capacity}>{car.capacity} Seats</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Ionicons name="cash-outline" size={16} color="#000" />
            <Text style={styles.price}>${car.pricePerDay}/Day</Text>
          </View>
          <Pressable style={styles.bookButton} onPress={handlePress}>
            <Text style={styles.bookButtonText}>Book now</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  carName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  capacity: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bookButton: {
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

