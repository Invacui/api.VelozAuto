/**
 * @file master.seed.ts
 * @description Seeds Indian geography (states/cities/RTO), brands, popular
 *              models and the feature catalogue. Idempotent (upserts).
 * @module Seeds
 * @author VehicleMarket Backend
 */

import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import Location from '../models/Location.model';
import Brand from '../models/Brand.model';
import VehicleModel from '../models/VehicleModel.model';
import Feature from '../models/Feature.model';
import { INDIAN_STATES } from '../constants/india';
import logger from '../logger/index';

const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface BrandSeed {
  name: string;
  categories: string[];
  country?: string;
  sortOrder?: number;
}

const BRANDS: BrandSeed[] = [
  // Passenger cars
  { name: 'Maruti Suzuki', categories: ['PASSENGER_CAR'], country: 'Japan', sortOrder: 1 },
  { name: 'Hyundai', categories: ['PASSENGER_CAR'], country: 'South Korea', sortOrder: 2 },
  { name: 'Tata Motors', categories: ['PASSENGER_CAR', 'COMMERCIAL'], country: 'India', sortOrder: 3 },
  { name: 'Mahindra', categories: ['PASSENGER_CAR', 'COMMERCIAL', 'THREE_WHEELER', 'CARAVAN_MOTORHOME'], country: 'India', sortOrder: 4 },
  { name: 'Honda', categories: ['PASSENGER_CAR', 'TWO_WHEELER'], country: 'Japan', sortOrder: 5 },
  { name: 'Toyota', categories: ['PASSENGER_CAR'], country: 'Japan', sortOrder: 6 },
  { name: 'Kia', categories: ['PASSENGER_CAR'], country: 'South Korea', sortOrder: 7 },
  { name: 'MG Motor', categories: ['PASSENGER_CAR'], country: 'China', sortOrder: 8 },
  { name: 'Skoda', categories: ['PASSENGER_CAR'], country: 'Czech Republic', sortOrder: 9 },
  { name: 'Renault', categories: ['PASSENGER_CAR'], country: 'France', sortOrder: 10 },
  { name: 'Volkswagen', categories: ['PASSENGER_CAR'], country: 'Germany', sortOrder: 11 },
  { name: 'Nissan', categories: ['PASSENGER_CAR'], country: 'Japan', sortOrder: 12 },
  { name: 'Mercedes-Benz', categories: ['PASSENGER_CAR'], country: 'Germany', sortOrder: 13 },
  { name: 'BMW', categories: ['PASSENGER_CAR'], country: 'Germany', sortOrder: 14 },
  { name: 'Audi', categories: ['PASSENGER_CAR'], country: 'Germany', sortOrder: 15 },
  // Commercial
  { name: 'Ashok Leyland', categories: ['COMMERCIAL'], country: 'India', sortOrder: 20 },
  { name: 'Eicher', categories: ['COMMERCIAL'], country: 'India', sortOrder: 21 },
  { name: 'BharatBenz', categories: ['COMMERCIAL'], country: 'Germany', sortOrder: 22 },
  { name: 'Force Motors', categories: ['COMMERCIAL', 'CARAVAN_MOTORHOME'], country: 'India', sortOrder: 23 },
  { name: 'Isuzu', categories: ['COMMERCIAL'], country: 'Japan', sortOrder: 24 },
  { name: 'Scania', categories: ['COMMERCIAL'], country: 'Sweden', sortOrder: 25 },
  { name: 'Piaggio', categories: ['THREE_WHEELER', 'COMMERCIAL'], country: 'Italy', sortOrder: 26 },
  // Two wheelers
  { name: 'Bajaj Auto', categories: ['TWO_WHEELER', 'THREE_WHEELER'], country: 'India', sortOrder: 30 },
  { name: 'TVS', categories: ['TWO_WHEELER'], country: 'India', sortOrder: 31 },
  { name: 'Hero MotoCorp', categories: ['TWO_WHEELER'], country: 'India', sortOrder: 32 },
  { name: 'Royal Enfield', categories: ['TWO_WHEELER'], country: 'India', sortOrder: 33 },
  { name: 'Suzuki', categories: ['TWO_WHEELER'], country: 'Japan', sortOrder: 34 },
  { name: 'Yamaha', categories: ['TWO_WHEELER'], country: 'Japan', sortOrder: 35 },
  { name: 'KTM', categories: ['TWO_WHEELER'], country: 'Austria', sortOrder: 36 },
  { name: 'Ola Electric', categories: ['TWO_WHEELER'], country: 'India', sortOrder: 37 },
  { name: 'Ather Energy', categories: ['TWO_WHEELER'], country: 'India', sortOrder: 38 },
  { name: 'Yatri Motorcycles', categories: ['TWO_WHEELER'], country: 'India', sortOrder: 39 },
  // Three wheelers
  { name: 'Mahindra Three Wheeler', categories: ['THREE_WHEELER'], country: 'India', sortOrder: 40 },
  { name: 'Kinetic Green', categories: ['THREE_WHEELER', 'TWO_WHEELER'], country: 'India', sortOrder: 41 },
  { name: 'YC Electric', categories: ['THREE_WHEELER'], country: 'India', sortOrder: 42 },
  // Caravan / motorhome
  { name: 'Caravan India', categories: ['CARAVAN_MOTORHOME'], country: 'India', sortOrder: 50 },
  { name: 'Hermes Motorhomes', categories: ['CARAVAN_MOTORHOME'], country: 'India', sortOrder: 51 },
];

const MODELS: { brand: string; name: string; category: string; bodyTypes: string[]; fuelOptions: string[] }[] = [
  { brand: 'Maruti Suzuki', name: 'Swift', category: 'PASSENGER_CAR', bodyTypes: ['HATCHBACK'], fuelOptions: ['PETROL', 'CNG'] },
  { brand: 'Maruti Suzuki', name: 'Baleno', category: 'PASSENGER_CAR', bodyTypes: ['HATCHBACK'], fuelOptions: ['PETROL', 'CNG'] },
  { brand: 'Maruti Suzuki', name: 'Dzire', category: 'PASSENGER_CAR', bodyTypes: ['SEDAN'], fuelOptions: ['PETROL', 'CNG'] },
  { brand: 'Maruti Suzuki', name: 'Ertiga', category: 'PASSENGER_CAR', bodyTypes: ['MUV'], fuelOptions: ['PETROL', 'CNG'] },
  { brand: 'Maruti Suzuki', name: 'Brezza', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['PETROL', 'CNG'] },
  { brand: 'Hyundai', name: 'Creta', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['PETROL', 'DIESEL'] },
  { brand: 'Hyundai', name: 'i20', category: 'PASSENGER_CAR', bodyTypes: ['HATCHBACK'], fuelOptions: ['PETROL'] },
  { brand: 'Hyundai', name: 'Verna', category: 'PASSENGER_CAR', bodyTypes: ['SEDAN'], fuelOptions: ['PETROL', 'DIESEL'] },
  { brand: 'Tata Motors', name: 'Nexon', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['PETROL', 'DIESEL', 'ELECTRIC'] },
  { brand: 'Tata Motors', name: 'Punch', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['PETROL', 'CNG', 'ELECTRIC'] },
  { brand: 'Mahindra', name: 'Scorpio', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['PETROL', 'DIESEL'] },
  { brand: 'Mahindra', name: 'Thar', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['PETROL', 'DIESEL'] },
  { brand: 'Honda', name: 'City', category: 'PASSENGER_CAR', bodyTypes: ['SEDAN'], fuelOptions: ['PETROL', 'HYBRID'] },
  { brand: 'Toyota', name: 'Innova Crysta', category: 'PASSENGER_CAR', bodyTypes: ['MUV'], fuelOptions: ['DIESEL'] },
  { brand: 'Toyota', name: 'Fortuner', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['DIESEL'] },
  { brand: 'Kia', name: 'Seltos', category: 'PASSENGER_CAR', bodyTypes: ['SUV'], fuelOptions: ['PETROL', 'DIESEL'] },
  { brand: 'Ashok Leyland', name: 'Dost', category: 'COMMERCIAL', bodyTypes: ['OPEN_BODY', 'CLOSED_CONTAINER'], fuelOptions: ['DIESEL', 'CNG'] },
  { brand: 'Ashok Leyland', name: 'Ecomet', category: 'COMMERCIAL', bodyTypes: ['OPEN_BODY', 'CLOSED_CONTAINER'], fuelOptions: ['DIESEL'] },
  { brand: 'Eicher', name: 'Pro 2049', category: 'COMMERCIAL', bodyTypes: ['OPEN_BODY', 'CLOSED_CONTAINER'], fuelOptions: ['DIESEL'] },
  { brand: 'BharatBenz', name: '1917R', category: 'COMMERCIAL', bodyTypes: ['OPEN_BODY', 'CLOSED_CONTAINER'], fuelOptions: ['DIESEL'] },
  { brand: 'Tata Motors', name: 'Ace', category: 'COMMERCIAL', bodyTypes: ['OPEN_BODY'], fuelOptions: ['DIESEL', 'CNG', 'ELECTRIC'] },
  { brand: 'Bajaj Auto', name: 'Pulsar 150', category: 'TWO_WHEELER', bodyTypes: ['MOTORCYCLE'], fuelOptions: ['PETROL'] },
  { brand: 'Hero MotoCorp', name: 'Splendor Plus', category: 'TWO_WHEELER', bodyTypes: ['MOTORCYCLE'], fuelOptions: ['PETROL'] },
  { brand: 'Royal Enfield', name: 'Classic 350', category: 'TWO_WHEELER', bodyTypes: ['MOTORCYCLE'], fuelOptions: ['PETROL'] },
  { brand: 'Honda', name: 'Activa 6G', category: 'TWO_WHEELER', bodyTypes: ['SCOOTER'], fuelOptions: ['PETROL'] },
  { brand: 'Ola Electric', name: 'S1 Pro', category: 'TWO_WHEELER', bodyTypes: ['SCOOTER'], fuelOptions: ['ELECTRIC'] },
  { brand: 'Piaggio', name: 'Ape City', category: 'THREE_WHEELER', bodyTypes: ['PASSENGER_AUTO'], fuelOptions: ['CNG', 'PETROL', 'DIESEL'] },
  { brand: 'Mahindra Three Wheeler', name: 'Treo', category: 'THREE_WHEELER', bodyTypes: ['E_RICKSHAW'], fuelOptions: ['ELECTRIC'] },
  { brand: 'Caravan India', name: 'Luxe Motorhome', category: 'CARAVAN_MOTORHOME', bodyTypes: ['MOTORHOME'], fuelOptions: ['DIESEL'] },
];

const FEATURES: { name: string; category: string; applicableCategories: string[] }[] = [
  { name: 'Airbags', category: 'SAFETY', applicableCategories: ['PASSENGER_CAR', 'COMMERCIAL'] },
  { name: 'ABS with EBD', category: 'SAFETY', applicableCategories: ['PASSENGER_CAR', 'TWO_WHEELER', 'COMMERCIAL'] },
  { name: 'Rear Parking Camera', category: 'SAFETY', applicableCategories: ['PASSENGER_CAR', 'COMMERCIAL'] },
  { name: 'Reverse Parking Sensors', category: 'SAFETY', applicableCategories: ['PASSENGER_CAR'] },
  { name: 'Electronic Stability Control', category: 'SAFETY', applicableCategories: ['PASSENGER_CAR'] },
  { name: 'Cruise Control', category: 'COMFORT', applicableCategories: ['PASSENGER_CAR', 'COMMERCIAL'] },
  { name: 'Automatic Climate Control', category: 'COMFORT', applicableCategories: ['PASSENGER_CAR', 'CARAVAN_MOTORHOME'] },
  { name: 'Power Windows', category: 'COMFORT', applicableCategories: ['PASSENGER_CAR', 'COMMERCIAL'] },
  { name: 'Push Button Start', category: 'COMFORT', applicableCategories: ['PASSENGER_CAR'] },
  { name: 'Sunroof', category: 'EXTERIOR', applicableCategories: ['PASSENGER_CAR'] },
  { name: 'Alloy Wheels', category: 'EXTERIOR', applicableCategories: ['PASSENGER_CAR', 'TWO_WHEELER'] },
  { name: 'LED Headlamps', category: 'EXTERIOR', applicableCategories: ['PASSENGER_CAR', 'TWO_WHEELER', 'COMMERCIAL'] },
  { name: 'Roof Rails', category: 'EXTERIOR', applicableCategories: ['PASSENGER_CAR'] },
  { name: 'Leather Seats', category: 'INTERIOR', applicableCategories: ['PASSENGER_CAR', 'CARAVAN_MOTORHOME'] },
  { name: 'Touchscreen Infotainment', category: 'TECH', applicableCategories: ['PASSENGER_CAR', 'CARAVAN_MOTORHOME'] },
  { name: 'Apple CarPlay / Android Auto', category: 'TECH', applicableCategories: ['PASSENGER_CAR'] },
  { name: 'GPS Navigation', category: 'TECH', applicableCategories: ['PASSENGER_CAR', 'COMMERCIAL', 'CARAVAN_MOTORHOME'] },
  { name: 'Telematics / Fleet Tracking', category: 'COMMERCIAL', applicableCategories: ['COMMERCIAL'] },
  { name: 'Air Conditioning (Cabin)', category: 'COMMERCIAL', applicableCategories: ['COMMERCIAL'] },
  { name: 'Power Steering', category: 'COMMERCIAL', applicableCategories: ['COMMERCIAL'] },
  { name: 'Kitchenette', category: 'COMFORT', applicableCategories: ['CARAVAN_MOTORHOME'] },
  { name: 'Onboard Toilet', category: 'COMFORT', applicableCategories: ['CARAVAN_MOTORHOME'] },
  { name: 'Solar Panel', category: 'TECH', applicableCategories: ['CARAVAN_MOTORHOME'] },
];

export const runMasterSeed = async (): Promise<void> => {
  // Locations
  for (const s of INDIAN_STATES) {
    await Location.updateOne(
      { state: s.name },
      {
        $set: {
          state: s.name,
          stateCode: s.code,
          isActive: true,
          cities: s.cities.map((city) => ({
            name: city,
            rtoCodes: s.rtoSamples.filter((r) => r.city === city).map((r) => r.code),
          })),
        },
      },
      { upsert: true }
    );
  }
  logger.info(`Seeded ${INDIAN_STATES.length} locations`);

  // Brands
  const brandIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const b of BRANDS) {
    const doc = await Brand.findOneAndUpdate(
      { name: b.name },
      { $set: { name: b.name, slug: slugify(b.name), categories: b.categories, country: b.country || 'India', isActive: true, sortOrder: b.sortOrder || 0 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    brandIds[b.name] = doc._id as mongoose.Types.ObjectId;
  }
  logger.info(`Seeded ${BRANDS.length} brands`);

  // Models
  for (const m of MODELS) {
    const brandId = brandIds[m.brand];
    if (!brandId) continue;
    await VehicleModel.updateOne(
      { brand: brandId, slug: slugify(`${m.brand} ${m.name}`) },
      {
        $set: {
          brand: brandId,
          brandName: m.brand,
          name: m.name,
          slug: slugify(`${m.brand} ${m.name}`),
          category: m.category,
          bodyTypes: m.bodyTypes,
          fuelOptions: m.fuelOptions,
          isActive: true,
        },
      },
      { upsert: true }
    );
  }
  logger.info(`Seeded ${MODELS.length} vehicle models`);

  // Features
  for (const f of FEATURES) {
    await Feature.updateOne(
      { name: f.name },
      { $set: { name: f.name, slug: slugify(f.name), category: f.category, applicableCategories: f.applicableCategories, isActive: true } },
      { upsert: true }
    );
  }
  logger.info(`Seeded ${FEATURES.length} features`);
};

if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await runMasterSeed();
      logger.info('Master seed completed');
    } catch (err: any) {
      logger.error('Master seed failed', { fileName: 'master.seed.ts', error: err.message });
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}

export default runMasterSeed;
