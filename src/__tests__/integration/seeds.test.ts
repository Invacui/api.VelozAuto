/**
 * @file seeds.test.ts
 * @description Runs every seeder against an in-memory MongoDB and asserts the
 *              resulting catalogue is populated (master data, accounts,
 *              sample vehicles, content).
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'seedtest' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Seeders', () => {
  it('seeds master data, accounts, vehicles and content', async () => {
    const { runMasterSeed } = await import('../../seeds/master.seed');
    const { runAdminSeed } = await import('../../seeds/admin.seed');
    const { runVehiclesSeed } = await import('../../seeds/vehicles.seed');
    const { runContentSeed } = await import('../../seeds/content.seed');

    await runMasterSeed();
    await runAdminSeed();
    await runVehiclesSeed();
    await runContentSeed();

    const User = (await import('../../models/User.model')).default;
    const Brand = (await import('../../models/Brand.model')).default;
    const Location = (await import('../../models/Location.model')).default;
    const Feature = (await import('../../models/Feature.model')).default;
    const Vehicle = (await import('../../models/Vehicle.model')).default;
    const Banner = (await import('../../models/Banner.model')).default;
    const Testimonial = (await import('../../models/Testimonial.model')).default;

    // Accounts
    expect(await User.countDocuments({ role: 'ADMIN' })).toBeGreaterThanOrEqual(1);
    expect(await User.countDocuments({ role: 'EMPLOYEE' })).toBeGreaterThanOrEqual(1);
    expect(await User.countDocuments({ role: 'USER' })).toBeGreaterThanOrEqual(1);

    // Master data
    expect(await Location.countDocuments()).toBeGreaterThanOrEqual(30); // 36 states/UTs
    expect(await Brand.countDocuments()).toBeGreaterThanOrEqual(20);
    expect(await Feature.countDocuments()).toBeGreaterThanOrEqual(10);

    // Vehicles across all categories
    const categories = await Vehicle.distinct('category');
    expect(categories).toEqual(
      expect.arrayContaining(['TWO_WHEELER', 'THREE_WHEELER', 'PASSENGER_CAR', 'COMMERCIAL', 'CARAVAN_MOTORHOME'])
    );
    expect(await Vehicle.countDocuments({ status: 'ACTIVE' })).toBeGreaterThanOrEqual(10);
    // every seeded vehicle must have at least one image + a slug
    expect(await Vehicle.countDocuments({ 'images.0': { $exists: true } })).toBe(await Vehicle.countDocuments());
    expect(await Vehicle.countDocuments({ slug: { $exists: true, $ne: '' } })).toBe(await Vehicle.countDocuments());

    // Content
    expect(await Banner.countDocuments()).toBeGreaterThanOrEqual(3);
    expect(await Testimonial.countDocuments()).toBeGreaterThanOrEqual(1);
  }, 120000);
});
