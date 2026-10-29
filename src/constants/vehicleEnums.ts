/**
 * @file vehicleEnums.ts
 * @description All vehicle-domain enumerations (§3 of the requirements).
 * @module Constants
 * @author VehicleMarket Backend
 */

export const VEHICLE_CATEGORIES = [
  'TWO_WHEELER',
  'THREE_WHEELER',
  'PASSENGER_CAR',
  'COMMERCIAL',
  'CARAVAN_MOTORHOME',
] as const;

export const USAGE_TYPES = ['PRIVATE', 'COMMERCIAL'] as const;

export const COMMERCIAL_SUB_CATEGORIES = [
  'LIGHT_COMMERCIAL',
  'MEDIUM_COMMERCIAL',
  'HEAVY_COMMERCIAL',
  'BUS_MINIBUS',
  'TAXI_CAB',
  'PASSENGER_AUTO',
  'E_RICKSHAW',
  'TRACTOR',
  'CONSTRUCTION_EQUIPMENT',
] as const;

export const CAR_BODY_TYPES = [
  'HATCHBACK',
  'SEDAN',
  'SUV',
  'MUV',
  'COUPE',
  'CONVERTIBLE',
  'PICKUP',
  'VAN',
] as const;

export const GOODS_BODY_TYPES = [
  'OPEN_BODY',
  'CLOSED_CONTAINER',
  'TIPPER',
  'TANKER',
  'FLATBED',
  'REFRIGERATED',
  'CAR_CARRIER',
  'TRAILER',
  'CHASSIS_ONLY',
] as const;

export const CARAVAN_BODY_TYPES = ['VANITY_VAN', 'MOTORHOME', 'CAMPER_TRAILER'] as const;

export const TWO_WHEELER_BODY_TYPES = ['MOTORCYCLE', 'SCOOTER', 'MOPED', 'BICYCLE_EV'] as const;

export const THREE_WHEELER_BODY_TYPES = ['PASSENGER_AUTO', 'GOODS_AUTO', 'E_RICKSHAW'] as const;

/** Union of every possible bodyType value. */
export const BODY_TYPES = [
  ...CAR_BODY_TYPES,
  ...GOODS_BODY_TYPES,
  ...CARAVAN_BODY_TYPES,
  ...TWO_WHEELER_BODY_TYPES,
  ...THREE_WHEELER_BODY_TYPES,
] as const;

export const FUEL_TYPES = [
  'PETROL',
  'DIESEL',
  'CNG',
  'LPG',
  'ELECTRIC',
  'HYBRID',
  'PETROL_CNG',
  'PETROL_LPG',
] as const;

export const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'AMT', 'CVT', 'DCT', 'IMT'] as const;

export const BS_NORMS = ['BS3', 'BS4', 'BS6', 'BS6_PHASE_2', 'ELECTRIC_NA'] as const;

export const OWNER_COUNTS = ['1ST', '2ND', '3RD', '4TH_PLUS'] as const;

export const VEHICLE_STATUSES = ['DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'INACTIVE'] as const;

export const IMAGE_TAGS = [
  'EXTERIOR',
  'INTERIOR',
  'ENGINE',
  'ODOMETER',
  'DOCUMENTS',
  'TYRES',
  'FRONT',
  'BACK',
  'SIDE',
] as const;

// ---- India registration & legal ----

export const REGISTRATION_TYPES = ['PRIVATE', 'COMMERCIAL', 'TAXI', 'GOVERNMENT_OTHER'] as const;

export const RC_TYPES = ['ORIGINAL', 'DUPLICATE'] as const;

export const OWNERSHIP_TRANSFER_STATUS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;

export const INSURANCE_TYPES = [
  'COMPREHENSIVE',
  'ZERO_DEPRECIATION',
  'THIRD_PARTY',
  'EXPIRED',
  'NONE',
] as const;

export const ROAD_TAX_STATUSES = ['LIFETIME', 'PAID_TILL_DATE', 'NOT_PAID'] as const;

export const PERMIT_TYPES = [
  'ALL_INDIA_NATIONAL',
  'STATE',
  'DISTRICT',
  'CONTRACT_CARRIAGE',
  'STAGE_CARRIAGE',
  'GOODS_CARRIAGE',
  'NONE',
] as const;

export const LOAN_STATUSES = ['NO_LOAN', 'ACTIVE_LOAN', 'NOC_AVAILABLE'] as const;

export const ACCIDENT_HISTORY = ['NONE', 'MINOR', 'MAJOR'] as const;

export const TYRE_CONDITIONS = ['EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_REPLACEMENT'] as const;

export const WARRANTY_TYPES = ['NONE', 'DEALER', 'EXTENDED', 'MANUFACTURER'] as const;

// ---- Commercial-specific ----

export const AXLE_CONFIGURATIONS = [
  '2X2',
  '4X2',
  '4X4',
  '6X2',
  '6X4',
  '6X6',
  '8X2',
  '8X4',
  '10_WHEELER',
  '12_WHEELER',
  '14_WHEELER',
  '16_WHEELER',
  'OTHER',
] as const;

export const CABIN_TYPES = ['DAY', 'SLEEPER', 'CREW', 'DAY_AND_SLEEPER'] as const;

// ---- Requests ----

export const BUY_REQUEST_STATUSES = [
  'NEW',
  'CONTACTED',
  'TEST_DRIVE_SCHEDULED',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;

export const BUDGET_RANGES = [
  'UNDER_2_LAKH',
  '2_5_LAKH',
  '5_10_LAKH',
  '10_20_LAKH',
  '20_50_LAKH',
  'ABOVE_50_LAKH',
] as const;

export const SELL_REQUEST_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'INSPECTION_SCHEDULED',
  'INSPECTED',
  'OFFER_MADE',
  'ACCEPTED',
  'REJECTED',
  'NEGOTIATING',
  'LISTED',
  'CLOSED',
] as const;

export const SELLER_TYPES = ['INDIVIDUAL', 'DEALER'] as const;

export const SELL_IMAGE_TAGS = [
  'FRONT',
  'BACK',
  'SIDES',
  'INTERIOR',
  'ODOMETER',
  'ENGINE',
  'TYRES',
  'RC_COPY',
] as const;

export const SELL_INSPECTION_SLOTS = ['MORNING_9_12', 'AFTERNOON_12_3', 'EVENING_3_6', 'WEEKEND'] as const;

/** Overall vehicle condition captured on the short sell form. */
export const SELL_VEHICLE_CONDITIONS = ['EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_REPLACEMENT'] as const;

// ---- Chat ----

export const CHAT_CATEGORIES = ['BUY_REQUEST', 'SELL_REQUEST', 'VEHICLE', 'FINANCE', 'PAYMENT', 'OTHER'] as const;

export const CHAT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const CHAT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export const SENDER_ROLES = ['USER', 'EMPLOYEE', 'ADMIN'] as const;

// ---- Content / master ----

export const BANNER_POSITIONS = ['HERO', 'SELL_STRIP', 'CATEGORIES', 'FOOTER'] as const;

export const CONTACT_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;

export const FEATURE_CATEGORIES = ['SAFETY', 'COMFORT', 'EXTERIOR', 'INTERIOR', 'TECH', 'COMMERCIAL'] as const;

export const NOTIFICATION_TYPES = [
  'NEW_BUY_REQUEST',
  'NEW_SELL_REQUEST',
  'NEW_CHAT_TICKET',
  'NEW_MESSAGE',
  'NEW_CONTACT',
  'SYSTEM',
] as const;

/** Body types allowed per vehicle category (drives dynamic forms/filters). */
export const BODY_TYPES_BY_CATEGORY: Record<string, readonly string[]> = {
  PASSENGER_CAR: CAR_BODY_TYPES,
  COMMERCIAL: GOODS_BODY_TYPES,
  CARAVAN_MOTORHOME: CARAVAN_BODY_TYPES,
  TWO_WHEELER: TWO_WHEELER_BODY_TYPES,
  THREE_WHEELER: THREE_WHEELER_BODY_TYPES,
};
