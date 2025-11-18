import { Car } from '@/types/car';
import { getDatabase } from './database';

interface CarRow {
  id: string;
  name: string;
  model: string;
  image: string;
  pricePerDay: number;
  type: string;
  description: string;
  capacity: number;
  transmission: string;
  features: string;
  available: number;
  createdAt?: string;
  updatedAt?: string;
}

const mapCarRowToCar = (row: CarRow): Car => {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    image: row.image,
    pricePerDay: row.pricePerDay,
    type: row.type as Car['type'],
    description: row.description,
    capacity: row.capacity,
    transmission: row.transmission as Car['transmission'],
    features: JSON.parse(row.features || '[]'),
    available: row.available === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const carService = {
  /**
   * Create a new car
   */
  create: async (car: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car> => {
    const database = await getDatabase();
    const id = `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `INSERT INTO cars (id, name, model, image, pricePerDay, type, description, capacity, transmission, features, available, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          car.name,
          car.model,
          car.image,
          car.pricePerDay,
          car.type,
          car.description,
          car.capacity,
          car.transmission,
          JSON.stringify(car.features),
          car.available ? 1 : 0,
          now,
          now,
        ]
      );
    });

    const newCar: Car = {
      ...car,
      id,
      createdAt: now,
      updatedAt: now,
    };

    return newCar;
  },

  /**
   * Get all cars
   */
  findAll: async (): Promise<Car[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<CarRow>(
      `SELECT * FROM cars ORDER BY createdAt DESC`
    );
    return rows.map(mapCarRowToCar);
  },

  /**
   * Get available cars only
   */
  findAvailable: async (): Promise<Car[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<CarRow>(
      `SELECT * FROM cars WHERE available = 1 ORDER BY createdAt DESC`
    );
    return rows.map(mapCarRowToCar);
  },

  /**
   * Find car by ID
   */
  findById: async (id: string): Promise<Car | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<CarRow>(
      `SELECT * FROM cars WHERE id = ?`,
      [id]
    );
    return row ? mapCarRowToCar(row) : null;
  },

  /**
   * Update car
   */
  update: async (id: string, updates: Partial<Car>): Promise<Car> => {
    const database = await getDatabase();
    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const values: (string | number)[] = [];

    Object.keys(updates).forEach((key) => {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return;

      if (key === 'features') {
        updateFields.push('features = ?');
        values.push(JSON.stringify(updates.features));
      } else if (key === 'available') {
        updateFields.push('available = ?');
        values.push(updates.available ? 1 : 0);
      } else {
        updateFields.push(`${key} = ?`);
        const value = (updates as Record<string, string | number>)[key];
        if (value !== undefined) {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      const car = await carService.findById(id);
      if (!car) {
        throw new Error('Car not found');
      }
      return car;
    }

    updateFields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `UPDATE cars SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
    });

    const car = await carService.findById(id);
    if (!car) {
      throw new Error('Car not found');
    }
    return car;
  },

  /**
   * Delete car
   */
  delete: async (id: string): Promise<void> => {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      await database.runAsync(`DELETE FROM cars WHERE id = ?`, [id]);
    });
  },

  /**
   * Search cars by query string
   */
  search: async (query: string, brandFilter?: string): Promise<Car[]> => {
    const database = await getDatabase();
    const searchTerm = `%${query.toLowerCase()}%`;
    
    let sql = `SELECT * FROM cars WHERE available = 1 AND (
      LOWER(name) LIKE ? OR 
      LOWER(description) LIKE ? OR 
      LOWER(model) LIKE ? OR
      LOWER(type) LIKE ?
    )`;
    
    const params: (string | number)[] = [searchTerm, searchTerm, searchTerm, searchTerm];
    
    if (brandFilter && brandFilter !== 'all') {
      sql += ` AND LOWER(type) = ?`;
      params.push(brandFilter.toLowerCase());
    }
    
    sql += ` ORDER BY createdAt DESC`;
    
    const rows = await database.getAllAsync<CarRow>(sql, params);
    return rows.map(mapCarRowToCar);
  },

  /**
   * Find cars by brand name
   */
  findByBrand: async (brandName: string): Promise<Car[]> => {
    const database = await getDatabase();
    
    // Map brand names to search terms
    const brandMap: Record<string, string[]> = {
      tesla: ['tesla'],
      bmw: ['bmw'],
      ferrari: ['ferrari'],
      lamborghini: ['lamborghini'],
    };
    
    const searchTerms = brandMap[brandName.toLowerCase()] || [brandName.toLowerCase()];
    const conditions = searchTerms.map(() => 'LOWER(name) LIKE ?').join(' OR ');
    const params = searchTerms.map(term => `%${term}%`);
    
    const sql = `SELECT * FROM cars WHERE available = 1 AND (${conditions}) ORDER BY createdAt DESC`;
    
    const rows = await database.getAllAsync<CarRow>(sql, params);
    return rows.map(mapCarRowToCar);
  },
};
