import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandFilter } from '@/components/brand-filter';
import { GarizetuLogo } from '@/components/garizetu-logo';
import { HorizontalCarCard } from '@/components/horizontal-car-card';
import { useDatabase } from '@/contexts/DatabaseContext';
import { carService } from '@/database/carService';
import { Car } from '@/types/car';

export default function HomeScreen() {
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const { isInitialized, isLoading: dbLoading } = useDatabase();

  // Load all cars
  useEffect(() => {
    const loadCars = async () => {
      if (!isInitialized) {
        return;
      }

      try {
        setIsLoading(true);
        const cars = await carService.findAvailable();
        setAvailableCars(cars);
        // Set initial filtered cars
        if (selectedBrand === 'all') {
          setFilteredCars(cars);
        }
      } catch (error) {
        console.error('Error loading cars:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCars();
  }, [isInitialized]);

  // Filter cars by brand
  useEffect(() => {
    const filterCarsByBrand = async () => {
      if (!isInitialized) {
        return;
      }

      if (selectedBrand === 'all') {
        // Use availableCars if already loaded, otherwise load fresh
        if (availableCars.length > 0) {
          setFilteredCars(availableCars);
        } else {
          try {
            setIsLoading(true);
            const cars = await carService.findAvailable();
            setFilteredCars(cars);
          } catch (error) {
            console.error('Error loading cars:', error);
          } finally {
            setIsLoading(false);
          }
        }
        return;
      }

      try {
        setIsLoading(true);
        const brandCars = await carService.findByBrand(selectedBrand);
        setFilteredCars(brandCars);
      } catch (error) {
        console.error('Error filtering cars by brand:', error);
        // Fallback to all cars on error
        if (availableCars.length > 0) {
          setFilteredCars(availableCars);
        }
      } finally {
        setIsLoading(false);
      }
    };

    filterCarsByBrand();
  }, [selectedBrand, isInitialized]);

  if (dbLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading cars...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <GarizetuLogo size={40} />
              <Text style={styles.appName}>Gari Zetu</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your dream car....."
              placeholderTextColor="#999"
            />
          </View>
          <Pressable style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color="#000" />
          </Pressable>
        </View>

        {/* Brands Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brands</Text>
          <BrandFilter selectedBrand={selectedBrand} onBrandSelect={setSelectedBrand} />
        </View>

        {/* Best Cars Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Best Cars</Text>
              <Text style={styles.sectionSubtitle}>Available</Text>
            </View>
            <Pressable>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          <FlatList
            data={filteredCars.slice(0, 10)}
            renderItem={({ item }) => <HorizontalCarCard car={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No cars found for this brand</Text>
              </View>
            }
          />
        </View>

        {/* Nearby Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby</Text>
            <Pressable>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          <FlatList
            data={filteredCars.slice(0, 5)}
            renderItem={({ item }) => <HorizontalCarCard car={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No cars found for this brand</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to prevent content from being hidden behind nav bar
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
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  carList: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    width: 280,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
