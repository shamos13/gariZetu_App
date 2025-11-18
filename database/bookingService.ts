import { Booking, BookingStatus, BookingWithCar, CreateBookingInput } from '@/types/booking';
import { getDatabase } from './database';

export const bookingService = {
  /**
   * Create a new booking
   */
  create: async (input: CreateBookingInput): Promise<Booking> => {
    const database = await getDatabase();
    const id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `INSERT INTO bookings (id, userId, carId, startDate, endDate, totalCost, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.userId,
          input.carId,
          input.startDate,
          input.endDate,
          input.totalCost,
          'pending',
          now,
          now,
        ]
      );
    });

    const booking: Booking = {
      id,
      ...input,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    return booking;
  },

  /**
   * Find booking by ID
   */
  findById: async (id: string): Promise<Booking | null> => {
    const database = await getDatabase();
    const result = await database.getFirstAsync<Booking>(
      `SELECT * FROM bookings WHERE id = ?`,
      [id]
    );
    return result || null;
  },

  /**
   * Find all bookings for a user
   */
  findByUserId: async (userId: string): Promise<Booking[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Booking>(
      `SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Find bookings with car details for a user
   */
  findWithCarByUserId: async (userId: string): Promise<BookingWithCar[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<BookingWithCar>(
      `SELECT 
        b.*,
        c.name as carName,
        c.image as carImage,
        c.type as carType
       FROM bookings b
       INNER JOIN cars c ON b.carId = c.id
       WHERE b.userId = ?
       ORDER BY b.createdAt DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Find bookings for a car
   */
  findByCarId: async (carId: string): Promise<Booking[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Booking>(
      `SELECT * FROM bookings WHERE carId = ? ORDER BY createdAt DESC`,
      [carId]
    );
    return rows;
  },

  /**
   * Update booking status
   */
  updateStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const database = await getDatabase();
    const now = new Date().toISOString();

    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `UPDATE bookings SET status = ?, updatedAt = ? WHERE id = ?`,
        [status, now, id]
      );
    });

    const booking = await bookingService.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  },

  /**
   * Cancel a booking
   */
  cancel: async (id: string): Promise<Booking> => {
    return bookingService.updateStatus(id, 'cancelled');
  },

  /**
   * Delete booking
   */
  delete: async (id: string): Promise<void> => {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      await database.runAsync(`DELETE FROM bookings WHERE id = ?`, [id]);
    });
  },

  /**
   * Check if a car is available for a date range
   */
  isCarAvailable: async (
    carId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> => {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE carId = ? 
       AND status IN ('pending', 'confirmed')
       AND (
         (startDate <= ? AND endDate >= ?) OR
         (startDate <= ? AND endDate >= ?) OR
         (startDate >= ? AND endDate <= ?)
       )`,
      [carId, startDate, startDate, endDate, endDate, startDate, endDate]
    );
    return (result?.count || 0) === 0;
  },
};
