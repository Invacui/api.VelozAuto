/**
 * @file vehicles.seed.ts
 * @description Seeds a realistic catalogue of used vehicles across every
 *              category (cars, commercial, two/three-wheelers, caravan).
 * @module Seeds
 * @author VehicleMarket Backend
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import Vehicle from '../models/Vehicle.model';
import Brand from '../models/Brand.model';
import User from '../models/User.model';
import logger from '../logger/index';

const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const img = (slug: string, n: number, tag: string) => ({
  url: `https://picsum.photos/seed/${slug}-${n}/800/600`,
  tag,
  order: n - 1,
  isPrimary: n === 1,
});

interface VSeed {
  brand: string;
  model: string;
  variant?: string;
  category: string;
  usageType: string;
  subCategory?: string;
  bodyType?: string;
  manufacturingYear: number;
  fuelType: string;
  transmission: string;
  kmDriven: number;
  ownerCount: string;
  price: number;
  emiStartingFrom?: number;
  seats?: number;
  color: string;
  registrationNumber: string;
  registrationState: string;
  rtoCode: string;
  registrationCity: string;
  isInspected: boolean;
  inspectionScore?: number;
  fuelNote?: string;
  locationState: string;
  locationCity: string;
  locationPincode: string;
  description: string;
  features: string[];
  highlights: string[];
  // commercial
  grossVehicleWeightKg?: number;
  payloadCapacityKg?: number;
  numberOfTyres?: number;
  axleConfiguration?: string;
  cabinType?: string;
  hasAc?: boolean;
  // caravan
  sleepingCapacity?: number;
  hasKitchenette?: boolean;
  hasToilet?: boolean;
  waterTankLitres?: number;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
  buildType?: string;
  rtoModificationApproved?: boolean;
  status?: string;
  isFeatured?: boolean;
}

const VEHICLES: VSeed[] = [
  {
    brand: 'Maruti Suzuki', model: 'Swift', variant: 'VXi', category: 'PASSENGER_CAR', usageType: 'PRIVATE', bodyType: 'HATCHBACK',
    manufacturingYear: 2019, fuelType: 'PETROL', transmission: 'MANUAL', kmDriven: 42000, ownerCount: '1ST', price: 495000, emiStartingFrom: 9200,
    seats: 5, color: 'Pearl White', registrationNumber: 'DL01AB1234', registrationState: 'Delhi', rtoCode: 'DL01', registrationCity: 'Delhi',
    isInspected: true, inspectionScore: 8.5,
    locationState: 'Delhi', locationCity: 'Delhi', locationPincode: '110001',
    description: 'Well maintained single-owner Swift VXi with full service history. New tyres, no accidents.',
    features: ['Airbags', 'ABS with EBD', 'Power Windows', 'Push Button Start'],
    highlights: ['Single owner', 'Full service history', 'New tyres'],
    isFeatured: true, status: 'ACTIVE',
  },
  {
    brand: 'Hyundai', model: 'Creta', variant: 'SX(O) Diesel', category: 'PASSENGER_CAR', usageType: 'PRIVATE', bodyType: 'SUV',
    manufacturingYear: 2021, fuelType: 'DIESEL', transmission: 'AUTOMATIC', kmDriven: 35000, ownerCount: '1ST', price: 1420000, emiStartingFrom: 26400,
    seats: 5, color: 'Titan Grey', registrationNumber: 'MH12CD5678', registrationState: 'Maharashtra', rtoCode: 'MH12', registrationCity: 'Pune',
    isInspected: true, inspectionScore: 9.0,
    locationState: 'Maharashtra', locationCity: 'Pune', locationPincode: '411001',
    description: 'Top-end Creta SX(O) with panoramic sunroof, ventilated seats and BlueLink connected car tech.',
    features: ['Sunroof', 'Automatic Climate Control', 'Rear Parking Camera', 'Apple CarPlay / Android Auto', 'LED Headlamps'],
    highlights: ['Panoramic sunroof', 'Ventilated seats', 'One owner'],
    isFeatured: true, status: 'ACTIVE',
  },
  {
    brand: 'Tata Motors', model: 'Nexon EV', variant: 'Max XZ+ Lux', category: 'PASSENGER_CAR', usageType: 'PRIVATE', bodyType: 'SUV',
    manufacturingYear: 2022, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', kmDriven: 21000, ownerCount: '1ST', price: 1350000, emiStartingFrom: 25100,
    seats: 5, color: 'Teal Blue', registrationNumber: 'KA03EF9012', registrationState: 'Karnataka', rtoCode: 'KA01', registrationCity: 'Bengaluru',
    isInspected: true, inspectionScore: 9.2,
    locationState: 'Karnataka', locationCity: 'Bengaluru', locationPincode: '560001',
    description: 'Nexon EV Max with 437km ARAI range, fast charging support and battery warranty transferable.',
    features: ['Airbags', 'Electronic Stability Control', 'Touchscreen Infotainment', 'Automatic Climate Control'],
    highlights: ['EV — very low running cost', 'Fast charging', 'Battery warranty'],
    isFeatured: true, status: 'ACTIVE',
  },
  {
    brand: 'Honda', model: 'City', variant: 'ZX CVT', category: 'PASSENGER_CAR', usageType: 'PRIVATE', bodyType: 'SEDAN',
    manufacturingYear: 2020, fuelType: 'PETROL', transmission: 'CVT', kmDriven: 48000, ownerCount: '2ND', price: 875000, emiStartingFrom: 16300,
    seats: 5, color: 'Platinum White', registrationNumber: 'HR26GH3456', registrationState: 'Haryana', rtoCode: 'HR26', registrationCity: 'Gurugram',
    isInspected: true, inspectionScore: 7.8,
    locationState: 'Haryana', locationCity: 'Gurugram', locationPincode: '122001',
    description: 'Honda City ZX CVT automatic with sunroof and lane watch camera. Second owner, clean record.',
    features: ['Sunroof', 'Rear Parking Camera', 'Cruise Control', 'Alloy Wheels'],
    highlights: ['Automatic', 'Sunroof', 'Low running'],
    status: 'ACTIVE',
  },
  {
    brand: 'Tata Motors', model: 'Ace', variant: 'Gold', category: 'COMMERCIAL', usageType: 'COMMERCIAL', subCategory: 'LIGHT_COMMERCIAL', bodyType: 'CLOSED_CONTAINER',
    manufacturingYear: 2018, fuelType: 'DIESEL', transmission: 'MANUAL', kmDriven: 96000, ownerCount: '2ND', price: 385000, emiStartingFrom: 7200,
    seats: 2, color: 'White', registrationNumber: 'UP32JK7890', registrationState: 'Uttar Pradesh', rtoCode: 'UP32', registrationCity: 'Lucknow',
    isInspected: true, inspectionScore: 7.0,
    locationState: 'Uttar Pradesh', locationCity: 'Lucknow', locationPincode: '226001',
    description: 'Tata Ace Gold mini truck with closed container body, ideal for last-mile distribution.',
    features: ['Power Steering', 'Telematics / Fleet Tracking'],
    highlights: ['LGV permit ready', 'Strong load body'],
    grossVehicleWeightKg: 1550, payloadCapacityKg: 710, numberOfTyres: 4, cabinType: 'DAY', hasAc: false,
    status: 'ACTIVE',
  },
  {
    brand: 'Ashok Leyland', model: 'Ecomet', variant: '1615 Tipper', category: 'COMMERCIAL', usageType: 'COMMERCIAL', subCategory: 'HEAVY_COMMERCIAL', bodyType: 'TIPPER',
    manufacturingYear: 2017, fuelType: 'DIESEL', transmission: 'MANUAL', kmDriven: 210000, ownerCount: '3RD', price: 1850000, emiStartingFrom: 34400,
    seats: 3, color: 'Yellow', registrationNumber: 'RJ14MN2345', registrationState: 'Rajasthan', rtoCode: 'RJ14', registrationCity: 'Jaipur',
    isInspected: false,
    locationState: 'Rajasthan', locationCity: 'Jaipur', locationPincode: '302001',
    description: 'Ashok Leyland Ecomet 1615 tipper for construction and mining haulage. Recently overhauled engine.',
    features: ['Power Steering', 'Air Conditioning (Cabin)', 'Telematics / Fleet Tracking'],
    highlights: ['Tipper body', 'Overhauled engine', 'High payload'],
    grossVehicleWeightKg: 16100, payloadCapacityKg: 9500, numberOfTyres: 6, axleConfiguration: '4X2', cabinType: 'DAY', hasAc: true,
    status: 'ACTIVE',
  },
  {
    brand: 'Eicher', model: 'Pro 2049', variant: 'Bus Minibus', category: 'COMMERCIAL', usageType: 'COMMERCIAL', subCategory: 'BUS_MINIBUS',
    manufacturingYear: 2019, fuelType: 'DIESEL', transmission: 'MANUAL', kmDriven: 145000, ownerCount: '2ND', price: 1650000, emiStartingFrom: 30700,
    seats: 32, color: 'Off White', registrationNumber: 'UP65PQ4567', registrationState: 'Uttar Pradesh', rtoCode: 'UP65', registrationCity: 'Kanpur',
    isInspected: true, inspectionScore: 7.5,
    locationState: 'Uttar Pradesh', locationCity: 'Kanpur', locationPincode: '208001',
    description: 'Eicher Pro 2049 32-seater mini bus with push-back seats, suitable for staff and school transport.',
    features: ['Air Conditioning (Cabin)', 'Power Steering', 'Telematics / Fleet Tracking'],
    highlights: ['32 seats', 'Tourist permit ready', 'Good tyres'],
    grossVehicleWeightKg: 10250, numberOfTyres: 6, axleConfiguration: '4X2', cabinType: 'DAY', hasAc: true,
    status: 'ACTIVE',
  },
  {
    brand: 'Maruti Suzuki', model: 'Dzire', variant: 'Tour S (Taxi)', category: 'PASSENGER_CAR', usageType: 'COMMERCIAL', subCategory: 'TAXI_CAB', bodyType: 'SEDAN',
    manufacturingYear: 2020, fuelType: 'PETROL_CNG', transmission: 'MANUAL', kmDriven: 78000, ownerCount: '1ST', price: 610000, emiStartingFrom: 11400,
    seats: 5, color: 'Silky Silver', registrationNumber: 'HR51RS6789', registrationState: 'Haryana', rtoCode: 'HR51', registrationCity: 'Faridabad',
    isInspected: true, inspectionScore: 7.2,
    locationState: 'Haryana', locationCity: 'Faridabad', locationPincode: '121001',
    description: 'Commercial taxi-registered Dzire Tour S with factory CNG. Ideal for fleet operators.',
    features: ['Airbags', 'Power Windows', 'ABS with EBD'],
    highlights: ['Commercial taxi registration', 'Factory CNG', 'Fleet ready'],
    status: 'ACTIVE',
  },
  {
    brand: 'Piaggio', model: 'Ape City', variant: 'Passenger Auto', category: 'THREE_WHEELER', usageType: 'COMMERCIAL', subCategory: 'PASSENGER_AUTO', bodyType: 'PASSENGER_AUTO',
    manufacturingYear: 2021, fuelType: 'CNG', transmission: 'MANUAL', kmDriven: 52000, ownerCount: '1ST', price: 245000, emiStartingFrom: 4600,
    seats: 4, color: 'Green', registrationNumber: 'TN09TU1234', registrationState: 'Tamil Nadu', rtoCode: 'TN09', registrationCity: 'Chennai',
    isInspected: false,
    locationState: 'Tamil Nadu', locationCity: 'Chennai', locationPincode: '600001',
    description: 'Piaggio Ape City CNG passenger auto with permit. Clean body, well-maintained engine.',
    features: [],
    highlights: ['CNG auto', 'Permit available'],
    status: 'ACTIVE',
  },
  {
    brand: 'Mahindra Three Wheeler', model: 'Treo', variant: 'Zor Grand E-Rickshaw', category: 'THREE_WHEELER', usageType: 'COMMERCIAL', subCategory: 'E_RICKSHAW', bodyType: 'E_RICKSHAW',
    manufacturingYear: 2022, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', kmDriven: 18000, ownerCount: '1ST', price: 215000, emiStartingFrom: 4000,
    seats: 4, color: 'Blue', registrationNumber: 'WB02VW5678', registrationState: 'West Bengal', rtoCode: 'WB02', registrationCity: 'Kolkata',
    isInspected: true, inspectionScore: 8.0,
    locationState: 'West Bengal', locationCity: 'Kolkata', locationPincode: '700001',
    description: 'Mahindra Treo e-rickshaw with lithium-ion battery, low running cost and zero emissions.',
    features: [],
    highlights: ['Electric', 'Lithium battery', 'Low running cost'],
    status: 'ACTIVE',
  },
  {
    brand: 'Royal Enfield', model: 'Classic 350', variant: 'Dark Stealth Black', category: 'TWO_WHEELER', usageType: 'PRIVATE', bodyType: 'MOTORCYCLE',
    manufacturingYear: 2020, fuelType: 'PETROL', transmission: 'MANUAL', kmDriven: 24000, ownerCount: '1ST', price: 145000, emiStartingFrom: 2700,
    seats: 2, color: 'Black', registrationNumber: 'KA05XY9012', registrationState: 'Karnataka', rtoCode: 'KA05', registrationCity: 'Mysuru',
    isInspected: true, inspectionScore: 8.4,
    locationState: 'Karnataka', locationCity: 'Mysuru', locationPincode: '570001',
    description: 'Royal Enfield Classic 350 in Stealth Black with ABS. Single owner, all services on time.',
    features: ['ABS with EBD', 'Alloy Wheels'],
    highlights: ['Single owner', 'ABS', 'Well maintained'],
    isFeatured: true, status: 'ACTIVE',
  },
  {
    brand: 'Honda', model: 'Activa 6G', variant: 'STD', category: 'TWO_WHEELER', usageType: 'PRIVATE', bodyType: 'SCOOTER',
    manufacturingYear: 2021, fuelType: 'PETROL', transmission: 'AUTOMATIC', kmDriven: 15000, ownerCount: '1ST', price: 62000, emiStartingFrom: 1200,
    seats: 2, color: 'Rebel Red', registrationNumber: 'GJ01ZA3456', registrationState: 'Gujarat', rtoCode: 'GJ01', registrationCity: 'Ahmedabad',
    isInspected: false,
    locationState: 'Gujarat', locationCity: 'Ahmedabad', locationPincode: '380001',
    description: 'Honda Activa 6G with silent start, LED headlamp and eSP technology. Garage kept.',
    features: ['LED Headlamps'],
    highlights: ['Low km', 'First owner', 'Serviced regularly'],
    status: 'ACTIVE',
  },
  {
    brand: 'Caravan India', model: 'Luxe Motorhome', variant: '4-Berth', category: 'CARAVAN_MOTORHOME', usageType: 'PRIVATE', bodyType: 'MOTORHOME',
    manufacturingYear: 2021, fuelType: 'DIESEL', transmission: 'MANUAL', kmDriven: 32000, ownerCount: '1ST', price: 3250000, emiStartingFrom: 60400,
    seats: 6, color: 'White', registrationNumber: 'GA01BC7890', registrationState: 'Goa', rtoCode: 'GA01', registrationCity: 'Panaji',
    isInspected: true, inspectionScore: 8.8,
    locationState: 'Goa', locationCity: 'Panaji', locationPincode: '403001',
    description: 'Fully fitted 4-berth motorhome on Force Traveller platform. Kitchenette, toilet, solar and 200L water tank.',
    features: ['Kitchenette', 'Onboard Toilet', 'Solar Panel', 'Automatic Climate Control'],
    highlights: ['4-berth', 'RTO approved modification', 'Fully equipped'],
    sleepingCapacity: 4, hasKitchenette: true, hasToilet: true, waterTankLitres: 200, lengthFt: 20, widthFt: 7, heightFt: 9.5,
    buildType: 'FACTORY_BUILT', rtoModificationApproved: true,
    status: 'ACTIVE',
  },
];

export const runVehiclesSeed = async (): Promise<void> => {
  const admin = await User.findOne({ role: 'ADMIN' });
  if (!admin) {
    throw new Error('No admin user found — run `npm run seed:admin` first.');
  }

  let created = 0;
  for (const v of VEHICLES) {
    const slugBase = slugify(`${v.manufacturingYear} ${v.brand} ${v.model} ${v.locationCity}`);
    const existing = await Vehicle.findOne({ slug: slugBase });
    if (existing) {
      logger.info(`Vehicle already exists: ${slugBase}`);
      continue;
    }
    const brand = await Brand.findOne({ name: v.brand });
    if (!brand) {
      logger.warn(`Brand not found, skipping: ${v.brand}`);
      continue;
    }
    const images = [
      img(slugBase, 1, 'FRONT'),
      img(slugBase, 2, 'BACK'),
      img(slugBase, 3, 'INTERIOR'),
      img(slugBase, 4, 'ENGINE'),
    ];
    await Vehicle.create({
      ...v,
      brand: brand._id,
      brandName: brand.name,
      slug: `${slugBase}-${Math.random().toString(36).slice(2, 6)}`,
      images,
      roadTax: 'LIFETIME',
      accidentHistory: 'NONE',
      tyreCondition: 'GOOD',
      floodDamage: false,
      createdBy: admin._id,
      status: v.status || 'ACTIVE',
      isFeatured: v.isFeatured || false,
    });
    created += 1;
  }
  logger.info(`Seeded ${created} vehicles (of ${VEHICLES.length})`);
};

if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await runVehiclesSeed();
      logger.info('Vehicles seed completed');
    } catch (err: any) {
      logger.error('Vehicles seed failed', { fileName: 'vehicles.seed.ts', error: err.message });
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}

export default runVehiclesSeed;
