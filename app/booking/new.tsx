import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { bookingService } from '@/database/bookingService';
import { carService } from '@/database/carService';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Car } from '@/types/car';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const currencyFormatter = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 0,
});

const isValidDateInput = (value: string) => DATE_REGEX.test(value) && !Number.isNaN(Date.parse(value));

export default function NewBookingScreen() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loadingCar, setLoadingCar] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accentColor = useThemeColor({ light: '#0a7ea4', dark: '#4DB6AC' }, 'tint');
  const cardBackground = useThemeColor({ light: '#FFFFFF', dark: '#1F1F1F' }, 'background');
  const mutedSurface = useThemeColor({ light: '#FCFCFC', dark: '#1B1B1B' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#2F2F2F' }, 'icon');
  const helperColor = useThemeColor({ light: '#666666', dark: '#B3B3B3' }, 'icon');
  const placeholderColor = useThemeColor({ light: '#999999', dark: '#C7C7C7' }, 'icon');
  const textColor = useThemeColor({}, 'text');
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [pendingPickerDate, setPendingPickerDate] = useState<Date>(new Date());

  const normalizeDate = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const toIsoDate = (date: Date) => normalizeDate(date).toISOString().split('T')[0];
  const addDays = (date: Date, days: number) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  };
  const formatDisplayDate = (value: string) => new Date(value).toLocaleDateString();

  const getMinimumDate = (type: 'start' | 'end') => {
    const today = normalizeDate(new Date());
    if (type === 'start') {
      return today;
    }
    if (startDate) {
      return addDays(new Date(startDate), 1);
    }
    return addDays(today, 1);
  };

  const handleDateSelection = (type: 'start' | 'end', date: Date) => {
    const isoValue = toIsoDate(date);
    if (type === 'start') {
      setStartDate(isoValue);
      if (endDate && Date.parse(endDate) <= Date.parse(isoValue)) {
        setEndDate('');
      }
    } else {
      setEndDate(isoValue);
    }
  };

  const openDatePicker = (type: 'start' | 'end') => {
    const currentValue =
      type === 'start'
        ? startDate
        : endDate || (startDate ? toIsoDate(addDays(new Date(startDate), 1)) : '');
    const baseDate = currentValue ? new Date(currentValue) : getMinimumDate(type);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: baseDate,
        minimumDate: getMinimumDate(type),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleDateSelection(type, selectedDate);
          }
        },
      });
      return;
    }

    setPendingPickerDate(baseDate);
    setActivePicker(type);
  };

  const cancelPicker = () => setActivePicker(null);
  const confirmPicker = () => {
    if (activePicker) {
      handleDateSelection(activePicker, pendingPickerDate);
    }
    setActivePicker(null);
  };

  useEffect(() => {
    const loadCar = async () => {
      if (!carId) {
        setLoadingCar(false);
        return;
      }

      try {
        setLoadingCar(true);
        const selectedCar = await carService.findById(carId);
        setCar(selectedCar);
      } catch (err) {
        console.error('Failed to load car', err);
        setError('Unable to load car details right now.');
      } finally {
        setLoadingCar(false);
      }
    };

    loadCar();
  }, [carId]);

  const previewDays = useMemo(() => {
    if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) {
      return 0;
    }
    const diffMs = Date.parse(endDate) - Date.parse(startDate);
    if (diffMs <= 0) {
      return 0;
    }
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const estimatedTotal = useMemo(() => {
    if (!car || previewDays === 0) {
      return 0;
    }
    return car.pricePerDay * previewDays;
  }, [car, previewDays]);

  const handleSubmit = async () => {
    if (!car) {
      return;
    }
    if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) {
      setError('Please enter valid dates using the YYYY-MM-DD format.');
      return;
    }
    if (Date.parse(endDate) <= Date.parse(startDate)) {
      setError('End date must be after start date.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const booking = await bookingService.createBooking({
        carId: car.id,
        userId: null,
        startDate,
        endDate,
        pickupLocation,
        notes,
        paymentStatus: requiresPayment ? 'pending' : 'not_required',
        pricePerDay: car.pricePerDay,
      });

      router.replace({
        pathname: '/booking/confirmation',
        params: { bookingId: booking.id },
      });
    } catch (err) {
      console.error('Failed to create booking', err);
      setError(err instanceof Error ? err.message : 'Something went wrong while saving your booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCar) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading car...</ThemedText>
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ThemedText type="subtitle">Car unavailable</ThemedText>
        <ThemedText style={styles.helperText}>Please pick another car to continue.</ThemedText>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: accentColor }]}>
          <ThemedText style={styles.backButtonText}>Back to cars</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Pressable onPress={() => router.back()} style={styles.inlineBack}>
            <ThemedText style={[styles.inlineBackText, { color: accentColor }]}>← Back</ThemedText>
          </Pressable>

          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <Image source={{ uri: car.image }} style={styles.heroImage} contentFit="cover" />
            <View style={styles.carDetails}>
              <ThemedText type="title" style={styles.carName}>
                {car.name}
              </ThemedText>
              <ThemedText style={styles.carMeta}>
                {car.model} • Ksh {currencyFormatter.format(car.pricePerDay)}/day
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Trip details
            </ThemedText>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Start date</ThemedText>
            <Pressable
              onPress={() => openDatePicker('start')}
              accessibilityRole="button"
              accessibilityLabel="Select start date"
              style={[
                styles.input,
                styles.dateField,
                {
                  borderColor,
                  backgroundColor: mutedSurface,
                },
              ]}>
              <ThemedText
                style={[
                  styles.dateValue,
                  {
                    color: startDate ? textColor : placeholderColor,
                  },
                ]}>
                {startDate ? formatDisplayDate(startDate) : 'Choose start date'}
              </ThemedText>
            </Pressable>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>End date</ThemedText>
              <Pressable
                onPress={() => openDatePicker('end')}
                accessibilityRole="button"
                accessibilityLabel="Select end date"
                style={[
                  styles.input,
                  styles.dateField,
                  {
                    borderColor,
                    backgroundColor: mutedSurface,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.dateValue,
                    {
                      color: endDate ? textColor : placeholderColor,
                    },
                  ]}>
                  {endDate ? formatDisplayDate(endDate) : 'Choose end date'}
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <ThemedText style={styles.label}>Pickup location (optional)</ThemedText>
                <TextInput
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                  placeholder="Airport, office..."
                  placeholderTextColor={placeholderColor}
                  style={[
                    styles.input,
                    {
                      borderColor,
                      backgroundColor: mutedSurface,
                      color: textColor,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Notes (optional)</ThemedText>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add handover instructions"
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={4}
                style={[
                  styles.input,
                  styles.textarea,
                  {
                    borderColor,
                    backgroundColor: mutedSurface,
                    color: textColor,
                  },
                ]}
              />
            </View>

            <View style={[styles.toggleRow, styles.formGroup]}>
              <View>
                <ThemedText style={styles.label}>Require payment step (dev)</ThemedText>
                <ThemedText style={[styles.helperText, { color: helperColor }]}>
                  Keeps payment status pending so you can test the simulate payment flow.
                </ThemedText>
              </View>
              <Switch value={requiresPayment} onValueChange={setRequiresPayment} />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Price summary
            </ThemedText>
            <View
              style={[
                styles.summaryCard,
                { borderColor, backgroundColor: mutedSurface },
              ]}>
              <View style={styles.summaryRow}>
                <ThemedText>Duration</ThemedText>
                <ThemedText type="defaultSemiBold">{previewDays > 0 ? `${previewDays} day(s)` : '--'}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText>Price per day</ThemedText>
                <ThemedText type="defaultSemiBold">
                  Ksh {currencyFormatter.format(car.pricePerDay)}
                </ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.summaryRow}>
                <ThemedText type="defaultSemiBold">Estimated total</ThemedText>
                <ThemedText type="title" style={styles.totalPrice}>
                  {estimatedTotal > 0 ? `Ksh ${currencyFormatter.format(estimatedTotal)}` : '--'}
                </ThemedText>
              </View>
              <ThemedText style={[styles.helperText, { color: helperColor }]}>
                Final total is stored when you confirm. Dates are calculated as whole days (end date exclusive).
              </ThemedText>
            </View>
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <Pressable
            onPress={handleSubmit}
            style={[
              styles.primaryButton,
              { backgroundColor: accentColor, opacity: isSubmitting ? 0.6 : 1 },
            ]}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Reserve (Dev)</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </ThemedView>
      {Platform.OS === 'ios' && activePicker ? (
        <Modal transparent animationType="fade" visible onRequestClose={cancelPicker}>
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerContainer, { backgroundColor: cardBackground }]}>
              <DateTimePicker
                value={pendingPickerDate}
                mode="date"
                display="inline"
                minimumDate={getMinimumDate(activePicker)}
                onChange={(_, date) => date && setPendingPickerDate(date)}
                style={styles.iosPicker}
              />
              <View style={styles.pickerActions}>
                <Pressable style={[styles.pickerButton, styles.pickerCancel]} onPress={cancelPicker}>
                  <ThemedText style={[styles.pickerButtonText, { color: helperColor }]}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.pickerButton, { backgroundColor: accentColor }]}
                  onPress={confirmPicker}>
                  <ThemedText style={[styles.pickerButtonText, { color: '#FFFFFF' }]}>Set date</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
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
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  inlineBack: {
    marginBottom: 12,
  },
  inlineBackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  carDetails: {
    padding: 16,
  },
  carName: {
    marginBottom: 8,
  },
  carMeta: {
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  dateField: {
    justifyContent: 'center',
    minHeight: 52,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 16,
    backgroundColor: '#FCFCFC',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: 8,
  },
  totalPrice: {
    fontSize: 24,
  },
  errorText: {
    color: '#C62828',
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  iosPicker: {
    width: '100%',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  pickerButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerCancel: {
    backgroundColor: 'transparent',
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

