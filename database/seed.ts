import { mockCars } from '@/data/mockCars';
import { Car } from '@/types/car';
import { carService } from './carService';

const carHasChanged = (existing: Car, incoming: Car) => {
  const fields: (keyof Car)[] = [
    'name',
    'model',
    'image',
    'pricePerDay',
    'type',
    'description',
    'capacity',
    'transmission',
    'available',
  ];

  for (const field of fields) {
    if (existing[field] !== incoming[field]) {
      return true;
    }
  }

  const existingFeatures = JSON.stringify(existing.features ?? []);
  const incomingFeatures = JSON.stringify(incoming.features ?? []);
  return existingFeatures !== incomingFeatures;
};

/*
  Seed the database with initial car data
 */
export const seedCars = async (): Promise<void> => {
  try {
    const existingCars = await carService.findAll();
    const existingMap = new Map(existingCars.map((car) => [car.id, car]));
    let createdCount = 0;
    let updatedCount = 0;

    for (const car of mockCars) {
      const record = existingMap.get(car.id);

      if (!record) {
        await carService.create(car);
        createdCount += 1;
        continue;
      }

      if (carHasChanged(record, car)) {
        await carService.update(car.id, car);
        updatedCount += 1;
      }
    }

    console.log(
      `Cars synced from mock data. Inserted: ${createdCount}, Updated: ${updatedCount}, Total mock entries: ${mockCars.length}`
    );
  } catch (error) {
    console.error('Error seeding cars:', error);
    throw error;
  }
};

