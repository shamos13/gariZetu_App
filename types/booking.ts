export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  carId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalCost: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  userId: string;
  carId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalCost: number;
}

export interface BookingWithCar extends Booking {
  carName: string;
  carImage: string;
  carType: string;
}

