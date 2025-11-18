export type CarType = 'SUV' | 'Sedan' | 'Van' | 'Hatchback' | 'Coupe' | 'Convertible';

export interface Car {
  id: string;
  name: string;
  model: string;
  image: string;
  pricePerDay: number;
  type: CarType;
  description: string;
  capacity: number;
  transmission: 'Automatic' | 'Manual';
  features: string[];
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

