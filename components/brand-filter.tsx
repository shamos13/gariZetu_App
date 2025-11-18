import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Brand {
  id: string;
  name: string;
  icon?: string;
}

const brands: Brand[] = [
  { id: 'all', name: 'ALL', icon: 'apps' },
  { id: 'tesla', name: 'Toyota', icon: 'flash' },
  { id: 'lamborghini', name: 'Ford Ranger', icon: 'car-sport' },
  { id: 'bmw', name: 'BMW', icon: 'car' },
  { id: 'ferrari', name: 'Nissan', icon: 'car-sport' },
];

interface BrandFilterProps {
  selectedBrand?: string;
  onBrandSelect?: (brandId: string) => void;
}

export function BrandFilter({ selectedBrand = 'all', onBrandSelect }: BrandFilterProps) {
  return (
    <View style={styles.container}>
      {brands.map((brand) => {
        const isSelected = selectedBrand === brand.id;
        return (
          <Pressable
            key={brand.id}
            onPress={() => onBrandSelect?.(brand.id)}
            style={[styles.brandButton, isSelected && styles.selectedBrand]}>
            {brand.icon && (
              <Ionicons
                name={brand.icon as any}
                size={20}
                color={isSelected ? '#FFF' : '#000'}
              />
            )}
            <Text style={[styles.brandText, isSelected && styles.selectedText]}>
              {brand.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  brandButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedBrand: {
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C',
  },
  brandText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#000',
    marginTop: 4,
  },
  selectedText: {
    color: '#FFF',
  },
});

