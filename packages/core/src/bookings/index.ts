/**
 * BOOKINGS & RESERVATIONS DOMAIN
 */

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface BookingEntity {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  scheduledAt: Date;
  status: BookingStatus;
  specialRequests?: string | null;
  tableNumber?: string | null;
  depositAmount?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableSlot {
  timeSlot: string; // e.g. "19:30"
  availableSeats: number;
  isAvailable: boolean;
}

export function validateBookingCapacity(params: {
  requestedGuests: number;
  maxPartySize: number;
  minPartySize?: number;
}): { valid: boolean; error?: string } {
  const min = params.minPartySize ?? 1;
  if (params.requestedGuests < min) {
    return {
      valid: false,
      error: `Quantidade de convidados deve ser de no mínimo ${min}.`,
    };
  }
  if (params.requestedGuests > params.maxPartySize) {
    return {
      valid: false,
      error: `Reserva online permite até ${params.maxPartySize} pessoas. Para grupos maiores, contate o concierge diretamente.`,
    };
  }
  return { valid: true };
}
