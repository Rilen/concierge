export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const Err = <E = Error>(error: E): Result<never, E> => ({
  success: false,
  error,
});

export type CurrencyCode = "BRL" | "USD" | "EUR";

export interface Money {
  cents: number;
  currency: CurrencyCode;
}

export function toMoney(amountInReal: number, currency: CurrencyCode = "BRL"): Money {
  return {
    cents: Math.round(amountInReal * 100),
    currency,
  };
}

export function fromMoney(money: Money): number {
  return money.cents / 100;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  coordinates?: GeoCoordinate | null;
}

export interface TenantContext {
  tenantId: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface UserSessionContext {
  userId: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "VENDOR_ADMIN" | "OPERATOR" | "CUSTOMER";
  tenantId?: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
