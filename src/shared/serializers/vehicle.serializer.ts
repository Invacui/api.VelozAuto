/**
 * @file vehicle.serializer.ts
 * @description Converts a Vehicle document to its public or staff response
 *              shape. The public shape masks the full registration number,
 *              chassis/engine numbers and internal inspection report URL.
 * @module Serializers
 * @author VehicleMarket Backend
 */

import { maskRegNumber } from '../helpers/registration.helper';

const STAFF_ONLY_FIELDS = ['chassisNumber', 'engineNumber', 'inspectionReportUrl'];

/** Primary/thumbnail image URL for a vehicle's image list. */
export const primaryImageUrl = (vehicle: any): string | null => {
  const images = vehicle?.images || [];
  return images.find((i: any) => i?.isPrimary)?.url || images[0]?.url || null;
};

/** Human-readable vehicle title (Vehicle has no stored `title` field). */
export const vehicleTitle = (vehicle: any): string =>
  [vehicle?.title, vehicle?.brandName, vehicle?.model, vehicle?.variant].filter(Boolean).join(' ');

/** Public-safe vehicle payload. */
export const toPublicVehicle = (vehicle: any) => {
  if (!vehicle) return vehicle;
  const out: Record<string, any> = { ...vehicle };

  out.id = String(vehicle._id);
  delete out._id;
  delete out.__v;

  if (vehicle.registrationNumber) {
    out.registrationNumber = maskRegNumber(vehicle.registrationNumber);
    out.registrationMasked = true;
  }
  out.primaryImage = primaryImageUrl(vehicle);
  out.title = vehicleTitle(vehicle);
  STAFF_ONLY_FIELDS.forEach((f) => delete out[f]);
  return out;
};

/** Full vehicle payload for admins/employees (all legal fields visible). */
export const toStaffVehicle = (vehicle: any) => {
  if (!vehicle) return vehicle;
  const out: Record<string, any> = { ...vehicle };
  out.id = String(vehicle._id);
  delete out._id;
  delete out.__v;
  out.primaryImage = primaryImageUrl(vehicle);
  out.title = vehicleTitle(vehicle);
  return out;
};

/** Compact card used in lists. */
export const toVehicleCard = (vehicle: any) => {
  const v = toPublicVehicle(vehicle);
  return {
    id: v.id,
    slug: v.slug,
    title: vehicleTitle(v),
    category: v.category,
    usageType: v.usageType,
    subCategory: v.subCategory,
    bodyType: v.bodyType,
    brandName: v.brandName,
    model: v.model,
    variant: v.variant,
    manufacturingYear: v.manufacturingYear,
    fuelType: v.fuelType,
    transmission: v.transmission,
    kmDriven: v.kmDriven,
    ownerCount: v.ownerCount,
    price: v.price,
    isPriceNegotiable: v.isPriceNegotiable,
    emiStartingFrom: v.emiStartingFrom,
    images: v.images || [],
    primaryImage: v.primaryImage ?? primaryImageUrl({ images: v.images }),
    status: v.status,
    isFeatured: v.isFeatured,
    isInspected: v.isInspected,
    views: v.views,
    locationCity: v.locationCity,
    locationState: v.locationState,
    bsNorm: v.bsNorm,
    createdAt: v.createdAt,
  };
};

export default { toPublicVehicle, toStaffVehicle, toVehicleCard, primaryImageUrl, vehicleTitle };
