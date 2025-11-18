import { Booking, BookingStatus, BookingWithCar, CreateBookingInput, PaymentStatus } from '@/types/booking';
import { carService } from './carService';
import { getDatabase } from './database';

type BookingRow = {
  id: string;
  bookingReference: string;
  userId: string | null;
  carId: string;
  startDate: string;
  endDate: string;
  pickupLocation: string | null;
  notes: string | null;
  pricePerDay: number;
  totalPrice: number;
  rentalDays: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  refundRequired: number;
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  synced: number;
};

type BookingWithCarRow = BookingRow & {
  carName: string;
  carImage: string;
  carType: string;
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const mapBookingRow = (row: BookingRow): Booking => ({
  id: row.id,
  bookingReference: row.bookingReference,
  userId: row.userId,
  carId: row.carId,
  startDate: row.startDate,
  endDate: row.endDate,
  pickupLocation: row.pickupLocation,
  notes: row.notes,
  pricePerDay: row.pricePerDay,
  totalPrice: row.totalPrice,
  rentalDays: row.rentalDays,
  bookingStatus: row.bookingStatus,
  paymentStatus: row.paymentStatus,
  refundRequired: row.refundRequired === 1,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  canceledAt: row.canceledAt,
  synced: row.synced,
});

const mapBookingWithCarRow = (row: BookingWithCarRow): BookingWithCar => ({
  ...mapBookingRow(row),
  carName: row.carName,
  carImage: row.carImage,
  carType: row.carType,
});

const normalizeDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date format. Please use YYYY-MM-DD.');
  }
  return parsed.toISOString();
};

const calculateRentalDays = (startDateIso: string, endDateIso: string): number => {
  const start = new Date(startDateIso).getTime();
  const end = new Date(endDateIso).getTime();
  if (end <= start) {
    throw new Error('End date must be after start date.');
  }
  const diff = (end - start) / MS_IN_DAY;
  return Math.max(1, Math.ceil(diff));
};

const generateBookingReference = async (): Promise<string> => {
  const database = await getDatabase();
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const existing = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM bookings WHERE bookingReference LIKE ?`,
    [`GZ-${datePart}-%`]
  );
  const sequence = ((existing?.count ?? 0) + 1).toString().padStart(4, '0');
  return `GZ-${datePart}-${sequence}`;
};

const getPricePerDay = async (input: CreateBookingInput): Promise<number> => {
  if (typeof input.pricePerDay === 'number') {
    return input.pricePerDay;
  }
  const car = await carService.findById(input.carId);
  if (!car) {
    throw new Error('Selected car is no longer available.');
  }
  return car.pricePerDay;
};

const buildUserClause = (userId: string | null | undefined) => {
  if (userId === undefined) {
    return { clause: '', params: [] as (string | null)[] };
  }
  if (userId === null) {
    return { clause: 'WHERE b.userId IS NULL', params: [] as (string | null)[] };
  }
  return { clause: 'WHERE b.userId = ?', params: [userId] };
};

const roundCurrency = (value: number): number => Number(value.toFixed(2));

export const bookingService = {
  /**
   * Create a new booking
   */
  createBooking: async (input: CreateBookingInput): Promise<Booking> => {
    const database = await getDatabase();
    const startDateIso = normalizeDate(input.startDate);
    const endDateIso = normalizeDate(input.endDate);
    const rentalDays = calculateRentalDays(startDateIso, endDateIso);

    if (!(await bookingService.isCarAvailable(input.carId, startDateIso, endDateIso))) {
      console.warn(
        `[bookingService] Overlapping booking detected for car ${input.carId} between ${startDateIso} and ${endDateIso}`
      );
      throw new Error('This car is already booked for the selected dates.');
    }

    const pricePerDay = await getPricePerDay(input);
    const totalPrice = roundCurrency(pricePerDay * rentalDays);
    const bookingReference = await generateBookingReference();
    const id = `booking_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();
    const paymentStatus: PaymentStatus = input.paymentStatus ?? 'not_required';
    const bookingStatus: BookingStatus = 'pending';
    const pickupLocation = input.pickupLocation?.trim() || null;
    const notes = input.notes?.trim() || null;

    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `INSERT INTO bookings (
          id,
          bookingReference,
          userId,
          carId,
          startDate,
          endDate,
          pickupLocation,
          notes,
          pricePerDay,
          totalPrice,
          rentalDays,
          bookingStatus,
          paymentStatus,
          refundRequired,
          createdAt,
          updatedAt,
          canceledAt,
          synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          bookingReference,
          input.userId ?? null,
          input.carId,
          startDateIso,
          endDateIso,
          pickupLocation,
          notes,
          pricePerDay,
          totalPrice,
          rentalDays,
          bookingStatus,
          paymentStatus,
          0,
          now,
          now,
          null,
          0,
        ]
      );
    });

    const inserted = await database.getFirstAsync<BookingRow>(
      `SELECT * FROM bookings WHERE id = ?`,
      [id]
    );

    if (!inserted) {
      throw new Error('Failed to create booking.');
    }

    return mapBookingRow(inserted);
  },

  /**
   * Load booking by ID
   */
  getBookingById: async (id: string): Promise<Booking | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<BookingRow>(
      `SELECT * FROM bookings WHERE id = ?`,
      [id]
    );
    return row ? mapBookingRow(row) : null;
  },

  /**
   * Load booking with car metadata
   */
  getBookingWithCarById: async (id: string): Promise<BookingWithCar | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<BookingWithCarRow>(
      `SELECT 
        b.*,
        c.name as carName,
        c.image as carImage,
        c.type as carType
       FROM bookings b
       INNER JOIN cars c ON c.id = b.carId
       WHERE b.id = ?`,
      [id]
    );
    return row ? mapBookingWithCarRow(row) : null;
  },

  /**
   * List bookings (optionally filtered by user)
   */
  getBookings: async (userId?: string | null): Promise<Booking[]> => {
    const database = await getDatabase();
    const { clause, params } = buildUserClause(userId);
    const rows = await database.getAllAsync<BookingRow>(
      `SELECT * FROM bookings ${clause} ORDER BY createdAt DESC`,
      params
    );
    return rows.map(mapBookingRow);
  },

  /**
   * List bookings with car cards
   */
  getBookingsWithCar: async (userId?: string | null): Promise<BookingWithCar[]> => {
    const database = await getDatabase();
    const { clause, params } = buildUserClause(userId);
    const rows = await database.getAllAsync<BookingWithCarRow>(
      `SELECT 
        b.*,
        c.name as carName,
        c.image as carImage,
        c.type as carType
       FROM bookings b
       INNER JOIN cars c ON c.id = b.carId
       ${clause}
       ORDER BY b.createdAt DESC`,
      params
    );
    return rows.map(mapBookingWithCarRow);
  },

  /**
   * List bookings for a car (useful for availability checks)
   */
  getBookingsForCar: async (carId: string): Promise<Booking[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<BookingRow>(
      `SELECT * FROM bookings WHERE carId = ? ORDER BY createdAt DESC`,
      [carId]
    );
    return rows.map(mapBookingRow);
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (id: string): Promise<Booking> => {
    const database = await getDatabase();
    const booking = await bookingService.getBookingById(id);

    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (!['pending', 'confirmed'].includes(booking.bookingStatus)) {
      throw new Error('Only pending or confirmed bookings can be canceled.');
    }

    const now = new Date().toISOString();
    const refundRequired = booking.paymentStatus === 'paid';

    await database.runAsync(
      `UPDATE bookings 
       SET bookingStatus = ?, 
           canceledAt = ?, 
           updatedAt = ?, 
           refundRequired = ?
       WHERE id = ?`,
      ['canceled', now, now, refundRequired ? 1 : 0, id]
    );

    const updated = await bookingService.getBookingById(id);
    if (!updated) {
      throw new Error('Failed to update booking.');
    }
    return updated;
  },

  /**
   * Simulate a successful payment (dev helper)
   */
  simulatePayment: async (id: string): Promise<Booking> => {
    const database = await getDatabase();
    const booking = await bookingService.getBookingById(id);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.paymentStatus === 'paid') {
      return booking;
    }

    const now = new Date().toISOString();
    await database.runAsync(
      `UPDATE bookings 
       SET paymentStatus = ?, 
           bookingStatus = CASE WHEN bookingStatus = 'pending' THEN 'confirmed' ELSE bookingStatus END,
           refundRequired = 0,
           updatedAt = ?
       WHERE id = ?`,
      ['paid', now, id]
    );

    const updated = await bookingService.getBookingById(id);
    if (!updated) {
      throw new Error('Failed to update payment status.');
    }
    return updated;
  },

  /**
   * Update booking status manually (admin/dev)
   */
  updateBookingStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const database = await getDatabase();
    const now = new Date().toISOString();
    await database.runAsync(
      `UPDATE bookings SET bookingStatus = ?, updatedAt = ? WHERE id = ?`,
      [status, now, id]
    );
    const updated = await bookingService.getBookingById(id);
    if (!updated) {
      throw new Error('Booking not found.');
    }
    return updated;
  },

  /**
   * Update payment status manually
   */
  updatePaymentStatus: async (id: string, status: PaymentStatus): Promise<Booking> => {
    const database = await getDatabase();
    const now = new Date().toISOString();
    await database.runAsync(
      `UPDATE bookings SET paymentStatus = ?, updatedAt = ? WHERE id = ?`,
      [status, now, id]
    );
    const updated = await bookingService.getBookingById(id);
    if (!updated) {
      throw new Error('Booking not found.');
    }
    return updated;
  },

  /**
   * Delete booking (dev helper)
   */
  deleteBooking: async (id: string): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM bookings WHERE id = ?`, [id]);
  },

  /**
   * Check if a car is available for a given date range
   */
  isCarAvailable: async (carId: string, startDateIso: string, endDateIso: string): Promise<boolean> => {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM bookings 
       WHERE carId = ?
         AND bookingStatus IN ('pending', 'confirmed')
         AND (
           (startDate <= ? AND endDate >= ?) OR
           (startDate <= ? AND endDate >= ?) OR
           (startDate >= ? AND endDate <= ?)
         )`,
      [carId, startDateIso, startDateIso, endDateIso, endDateIso, startDateIso, endDateIso]
    );
    return (result?.count ?? 0) === 0;
  },
};
