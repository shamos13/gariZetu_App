import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { HorizontalCarCard } from '@/components/horizontal-car-card';
import { useDatabase } from '@/contexts/DatabaseContext';
import { carService } from '@/database/carService';
import { Car } from '@/types/car';

export default function SearchScreen() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const { isInitialized } = useDatabase();

  // Debounce search query
  useEffect(() => {
    const searchCars = async () => {
      if (!isInitialized) {
        return;
      }

      // If search query is empty, show all available cars
      if (!searchQuery.trim() && selectedBrand === 'all') {
        try {
          setIsLoading(true);
          const allCars = await carService.findAvailable();
          setCars(allCars);
        } catch (error) {
          console.error('Error loading cars:', error);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Perform database search
      try {
        setIsLoading(true);
        const searchResults = await carService.search(searchQuery.trim(), selectedBrand);
        setCars(searchResults);
      } catch (error) {
        console.error('Error searching cars:', error);
        setCars([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchCars();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedBrand, isInitialized]);

  // Initial load
  useEffect(() => {
    if (isInitialized && !searchQuery && selectedBrand === 'all') {
      const loadInitialCars = async () => {
        try {
          setIsLoading(true);
          const allCars = await carService.findAvailable();
          setCars(allCars);
        } catch (error) {
          console.error('Error loading cars:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadInitialCars();
    }
  }, [isInitialized]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Search</Text>
        <Pressable style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your dream car....."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color="#000" />
          </Pressable>
        </View>

        {/* Brand Filters */}
        <View style={styles.section}>
          <BrandFilter selectedBrand={selectedBrand} onBrandSelect={setSelectedBrand} />
        </View>

        {/* Results */}
        <View style={styles.section}>
          {!isLoading && (
            <Text style={styles.resultsText}>
              {cars.length} {cars.length === 1 ? 'car found' : 'cars found'}
              {searchQuery && ` for "${searchQuery}"`}
            </Text>
          )}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2C2C2C" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={cars}
              renderItem={({ item }) => <HorizontalCarCard car={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyText}>No cars found</Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Start typing to search for cars'}
                  </Text>
                </View>
              }
            />
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  menuButton: {
    padding: 4,
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
  resultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  carList: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

