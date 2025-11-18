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

      // Cars table
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

      // Bookings table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          carId TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          totalCost REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
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

