import { mockCars } from '@/data/mockCars';
import { carService } from './carService';

/*
  Seed the database with initial car data
 */
export const seedCars = async (): Promise<void> => {
  try {
    // Check if cars already exist
    const existingCars = await carService.findAll();
    
    if (existingCars.length > 0) {
      console.log('Cars already exist in database, skipping seed');
      return;
    }

    // Insert mock cars
    console.log('Seeding cars into database...');
    for (const car of mockCars) {
      await carService.create(car);
    }
    console.log(`Successfully seeded ${mockCars.length} cars`);
  } catch (error) {
    console.error('Error seeding cars:', error);
    throw error;
  }
};

