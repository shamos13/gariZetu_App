import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { bookingService } from '@/database/bookingService';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BookingWithCar } from '@/types/booking';

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 0,
});

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const bookingStatusTone = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'info';
    case 'pending':
      return 'warning';
    case 'canceled':
      return 'danger';
    default:
      return 'neutral';
  }
};

const paymentStatusTone = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
};

export default function BookingConfirmationScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingWithCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const accentColor = useThemeColor({ light: '#0a7ea4', dark: '#4DB6AC' }, 'tint');
  const accentText = useThemeColor({ light: '#FFFFFF', dark: '#0B0F10' }, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#2F2F2F' }, 'icon');
  const helperColor = useThemeColor({ light: '#666666', dark: '#B3B3B3' }, 'icon');

  const loadBooking = async () => {
    if (!bookingId) {
      setError('Missing booking reference.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await bookingService.getBookingWithCarById(bookingId);
      setBooking(data);
      if (!data) {
        setError('Booking not found.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load booking', err);
      setError('Unable to load booking information.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const handleSimulatePayment = async () => {
    if (!bookingId) {
      return;
    }
    try {
      setIsSimulating(true);
      await bookingService.simulatePayment(bookingId);
      await loadBooking();
    } catch (err) {
      console.error('Failed to simulate payment', err);
      setError(err instanceof Error ? err.message : 'Unable to simulate payment right now.');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Preparing confirmation...</ThemedText>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ThemedText type="subtitle">We couldn't find that booking.</ThemedText>
        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: accentColor, shadowColor: accentColor },
          ]}
          onPress={() => router.replace('/(tabs)')}>
          <ThemedText style={[styles.primaryButtonText, { color: accentText }]}>
            Browse cars
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: booking.carImage }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.statusRow}>
            <StatusPill label={`${booking.bookingStatus}`} tone={bookingStatusTone(booking.bookingStatus)} />
            <StatusPill label={`${booking.paymentStatus.replace('_', ' ')}`} tone={paymentStatusTone(booking.paymentStatus)} />
          </View>

          <View style={styles.messageCard}>
            <ThemedText type="title" style={styles.title}>
              Booking saved!
            </ThemedText>
            <ThemedText style={styles.bodyText}>
              Your booking is saved. Booking reference: {booking.bookingReference}. Payment: {booking.paymentStatus === 'not_required' ? 'Not required (development).' : booking.paymentStatus}.
            </ThemedText>
          </View>

          <View style={[styles.summaryCard, { borderColor, backgroundColor: surfaceColor }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Trip summary
            </ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.label}>Car</ThemedText>
              <ThemedText style={styles.value}>{booking.carName}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.label}>Reference</ThemedText>
              <ThemedText style={styles.value}>{booking.bookingReference}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.label}>Dates</ThemedText>
              <ThemedText style={styles.value}>
                {formatDate(booking.startDate)} → {formatDate(booking.endDate)} ({booking.rentalDays} day{booking.rentalDays > 1 ? 's' : ''})
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.label}>Total</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.totalValue}>
                Ksh {currencyFormatter.format(booking.totalPrice)}
              </ThemedText>
            </View>
            {booking.pickupLocation ? (
              <View style={styles.summaryRow}>
                <ThemedText style={styles.label}>Pickup location</ThemedText>
                <ThemedText style={styles.value}>{booking.pickupLocation}</ThemedText>
              </View>
            ) : null}
            {booking.notes ? (
              <View style={styles.notesBlock}>
                <ThemedText style={styles.label}>Notes</ThemedText>
                <ThemedText style={styles.value}>{booking.notes}</ThemedText>
              </View>
            ) : null}
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          {booking.paymentStatus === 'pending' ? (
            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: accentColor,
                  marginBottom: 12,
                  shadowColor: accentColor,
                },
              ]}
              onPress={handleSimulatePayment}
              disabled={isSimulating}>
              {isSimulating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={[styles.primaryButtonText, { color: accentText }]}>
                  Simulate payment
                </ThemedText>
              )}
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.secondaryButton, { borderColor: accentColor }]}
            onPress={() => router.replace('/(tabs)/bookings')}>
            <ThemedText style={[styles.secondaryButtonText, { color: accentColor }]}>
              Go to My Bookings
            </ThemedText>
          </Pressable>

          <Pressable style={styles.linkButton} onPress={() => router.replace('/(tabs)')}>
            <ThemedText style={[styles.linkText, { color: accentColor }]}>Back to cars</ThemedText>
          </Pressable>
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
  scrollContent: {
    paddingBottom: 32,
  },
  heroImage: {
    width: '100%',
    height: 260,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  messageCard: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  title: {
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  summaryCard: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 18,
  },
  notesBlock: {
    marginTop: 12,
  },
  primaryButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    color: '#C62828',
    marginHorizontal: 16,
    marginTop: 8,
  },
});

