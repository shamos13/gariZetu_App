import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
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

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingWithCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const accentColor = useThemeColor({ light: '#0a7ea4', dark: '#4DB6AC' }, 'tint');
  const accentTextColor = useThemeColor({ light: '#FFFFFF', dark: '#0B0F10' }, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
  const listBackground = useThemeColor({ light: '#F8F8F8', dark: '#101112' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#2F2F2F' }, 'icon');
  const helperColor = useThemeColor({ light: '#666666', dark: '#B3B3B3' }, 'icon');
  const textColor = useThemeColor({}, 'text');

  const loadBookings = useCallback(async () => {
    try {
      const data = await bookingService.getBookingsWithCar();
      setBookings(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load bookings', err);
      setError('Unable to load bookings.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleSimulatePayment = async (bookingId: string) => {
    try {
      setActionBookingId(bookingId);
      await bookingService.simulatePayment(bookingId);
      await loadBookings();
    } catch (err) {
      console.error('Failed to simulate payment', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment status.');
    } finally {
      setActionBookingId(null);
    }
  };

  const confirmCancel = (bookingId: string) => {
    Alert.alert(
      'Cancel booking',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => handleCancelBooking(bookingId),
        },
      ]
    );
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setActionBookingId(bookingId);
      await bookingService.cancelBooking(bookingId);
      await loadBookings();
    } catch (err) {
      console.error('Failed to cancel booking', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setActionBookingId(null);
    }
  };

  const renderBooking = ({ item }: { item: BookingWithCar }) => {
    const isActionLoading = actionBookingId === item.id;
    const canCancel = ['pending', 'confirmed'].includes(item.bookingStatus);
    const canSimulatePayment = item.paymentStatus === 'pending';

    return (
      <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
        <Image source={{ uri: item.carImage }} style={styles.cardImage} contentFit="cover" />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <ThemedText type="defaultSemiBold" style={styles.carName}>
              {item.carName}
            </ThemedText>
            <StatusPill label={item.bookingStatus} tone={bookingStatusTone(item.bookingStatus)} />
          </View>
          <ThemedText style={styles.reference}>Ref: {item.bookingReference}</ThemedText>
          <View style={styles.badgesRow}>
            <StatusPill label={item.paymentStatus.replace('_', ' ')} tone={paymentStatusTone(item.paymentStatus)} />
            <StatusPill label={`${item.rentalDays} day${item.rentalDays > 1 ? 's' : ''}`} tone="neutral" />
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Dates</ThemedText>
            <ThemedText style={styles.value}>
              {formatDate(item.startDate)} → {formatDate(item.endDate)}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>
              Ksh {currencyFormatter.format(item.totalPrice)}
            </ThemedText>
          </View>
          {item.pickupLocation ? (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Pickup</ThemedText>
              <ThemedText style={styles.value}>{item.pickupLocation}</ThemedText>
            </View>
          ) : null}

          <View style={styles.cardActions}>
            {canSimulatePayment ? (
              <Pressable
                style={[
                  styles.actionButton,
                  styles.primaryAction,
                  { backgroundColor: accentColor, shadowColor: accentColor },
                ]}
                onPress={() => handleSimulatePayment(item.id)}
                disabled={isActionLoading}>
                {isActionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText
                    style={[styles.actionTextPrimary, { color: accentTextColor }]}>
                    Simulate payment
                  </ThemedText>
                )}
              </Pressable>
            ) : null}

            {canCancel ? (
              <Pressable
                style={[
                  styles.actionButton,
                  styles.outlineAction,
                  { borderColor, backgroundColor: surfaceColor },
                ]}
                onPress={() => confirmCancel(item.id)}
                disabled={isActionLoading}>
                {isActionLoading ? (
                  <ActivityIndicator />
                ) : (
                  <ThemedText style={[styles.outlineText, { color: textColor }]}>
                    Cancel booking
                  </ThemedText>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const listEmpty = () => (
    <View style={styles.emptyState}>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No bookings yet
      </ThemedText>
      <ThemedText style={[styles.emptyCopy, { color: helperColor }]}>
        Browse cars and reserve your first ride.
      </ThemedText>
      <Pressable
        style={[
          styles.primaryButton,
          { backgroundColor: accentColor, shadowColor: accentColor },
        ]}
        onPress={() => router.push('/(tabs)')}>
        <ThemedText style={[styles.primaryButtonText, { color: accentTextColor }]}>
          Find a car
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
          <ThemedText style={[styles.loaderText, { color: helperColor }]}>
            Loading your bookings...
          </ThemedText>
        </View>
      ) : (
        <>
          {error ? (
            <ThemedText style={[styles.errorText, { color: '#D32F2F' }]}>{error}</ThemedText>
          ) : null}
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={renderBooking}
            contentContainerStyle={
              bookings.length === 0
                ? [styles.emptyContainer, { backgroundColor }]
                : [styles.listContent, { backgroundColor: listBackground }]
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={listEmpty}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loaderText: {
    marginTop: 12,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carName: {
    flex: 1,
    marginRight: 12,
  },
  reference: {
    fontSize: 13,
    opacity: 0.7,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    borderWidth: 0,
  },
  outlineAction: {
    borderWidth: 1,
  },
  actionTextPrimary: {
    fontWeight: '700',
  },
  outlineText: {
    fontWeight: '600',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyCopy: {
    textAlign: 'center',
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    fontWeight: '700',
  },
});

