import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('carHire.db');
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    
    await database.withTransactionAsync(async () => {
      // Enable foreign keys
      await database.execAsync('PRAGMA foreign_keys = ON;');

      // Users table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          fullName TEXT NOT NULL,
          phoneNumber TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      console.log('Users table created');

      // Cars table (dev-mode sync: drop to keep seed data authoritative)
      await database.execAsync(`DROP TABLE IF EXISTS cars;`);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS cars (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          model TEXT NOT NULL,
          image TEXT NOT NULL,
          pricePerDay REAL NOT NULL,
          type TEXT NOT NULL,
          description TEXT NOT NULL,
          capacity INTEGER NOT NULL,
          transmission TEXT NOT NULL,
          features TEXT NOT NULL,
          available INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      console.log('Cars table created');

      // Ensure latest booking schema (dev-mode: destructive reset)
      await database.execAsync(`DROP TABLE IF EXISTS bookings;`);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY NOT NULL,
          bookingReference TEXT UNIQUE NOT NULL,
          userId TEXT NULL,
          carId TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          pickupLocation TEXT NULL,
          notes TEXT NULL,
          pricePerDay REAL NOT NULL,
          totalPrice REAL NOT NULL,
          rentalDays INTEGER NOT NULL,
          bookingStatus TEXT NOT NULL DEFAULT 'pending',
          paymentStatus TEXT NOT NULL DEFAULT 'not_required',
          refundRequired INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          canceledAt TEXT NULL,
          synced INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (carId) REFERENCES cars(id) ON DELETE CASCADE
        );
      `);
      console.log('Bookings table created');

      // Create indexes for better performance
      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_bookings_userId ON bookings(userId);
      `);
      console.log('Index created for bookings.userId');

      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_bookings_carId ON bookings(carId);
      `);
      console.log('Index created for bookings.carId');

      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_bookings_bookingReference ON bookings(bookingReference);
      `);
      console.log('Index created for bookings.bookingReference');

      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_bookings_bookingStatus ON bookings(bookingStatus);
      `);
      console.log('Index created for bookings.bookingStatus');

      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_bookings_paymentStatus ON bookings(paymentStatus);
      `);
      console.log('Index created for bookings.paymentStatus');

      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cars_available ON cars(available);
      `);
      console.log('Index created for cars.available');
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};

