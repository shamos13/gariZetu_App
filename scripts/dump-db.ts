import fs from 'fs';
import path from 'path';

import initSqlJs, { Database } from 'sql.js';

import { mockCars } from '@/data/mockCars';

const OUTPUT_PATH = path.resolve(process.cwd(), 'carHire.db');

const createSchema = (db: Database) => {
  db.run('PRAGMA foreign_keys = ON;');
  db.run(`
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

  db.run(`
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
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);
};

const insertCars = (db: Database) => {
  const now = new Date().toISOString();
  const statement = db.prepare(`
    INSERT INTO cars (
      id,
      name,
      model,
      image,
      pricePerDay,
      type,
      description,
      capacity,
      transmission,
      features,
      available,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  mockCars.forEach((car) => {
    statement.run([
      car.id,
      car.name,
      car.model,
      car.image,
      car.pricePerDay,
      car.type,
      car.description,
      car.capacity,
      car.transmission,
      JSON.stringify(car.features ?? []),
      car.available ? 1 : 0,
      now,
      now,
    ]);
  });

  statement.free();
};

const dumpDatabase = async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  createSchema(db);
  insertCars(db);

  const data = db.export();
  fs.writeFileSync(OUTPUT_PATH, Buffer.from(data));

  console.log(`SQLite dump written to ${OUTPUT_PATH}`);
};

dumpDatabase().catch((error) => {
  console.error('Failed to dump SQLite database', error);
  process.exit(1);
});

