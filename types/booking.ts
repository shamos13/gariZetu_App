export type BookingStatus = 'pending' | 'confirmed' | 'canceled' | 'completed';

export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed';

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string | null;
  carId: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string | null;
  notes?: string | null;
  pricePerDay: number;
  totalPrice: number;
  rentalDays: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  refundRequired: boolean;
  createdAt: string;
  updatedAt: string;
  canceledAt?: string | null;
  synced?: number;
}

export interface CreateBookingInput {
  userId?: string | null;
  carId: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  notes?: string;
  paymentStatus?: PaymentStatus;
  pricePerDay?: number;
}

export interface BookingWithCar extends Booking {
  carName: string;
  carImage: string;
  carType: string;
}

