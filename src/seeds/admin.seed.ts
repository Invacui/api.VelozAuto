/**
 * @file admin.seed.ts
 * @description Seeds the default admin, employee and demo user accounts.
 *              Idempotent — existing accounts are left untouched.
 * @module Seeds
 * @author VehicleMarket Backend
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import User from '../models/User.model';
import envConfig from '../config/environment';
import logger from '../logger/index';

const ACCOUNTS = [
  { name: 'Platform Admin', email: 'admin@velozauto.in', phone: '9000000001', password: 'Admin@123', role: 'ADMIN' as const },
  { name: 'Support Employee', email: 'employee@vehiclemarket.in', phone: '9000000002', password: 'Employee@123', role: 'EMPLOYEE' as const },
  { name: 'Demo User', email: 'user@vehiclemarket.in', phone: '9000000003', password: 'User@12345', role: 'USER' as const },
];

export const runAdminSeed = async (): Promise<void> => {
  const { adminEmail } = envConfig.getAdminConfig();

  // Migrate the legacy admin email to the Veloz Auto domain.
  const legacyAdmin = await User.findOne({ email: 'admin@vehiclemarket.in' });
  if (legacyAdmin && !(await User.findOne({ email: 'admin@velozauto.in' }))) {
    legacyAdmin.email = 'admin@velozauto.in';
    await legacyAdmin.save();
    logger.info('Migrated admin email: admin@vehiclemarket.in -> admin@velozauto.in');
  }

  for (const acct of ACCOUNTS) {
    const email = acct.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      logger.info(`User already exists: ${email}`);
      continue;
    }
    await User.create({
      name: acct.name,
      email,
      phone: acct.phone,
      passwordHash: acct.password, // hashed by the model pre-save hook
      role: acct.role,
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
    });
    logger.info(`Created ${acct.role}: ${email}`);
  }

  // Ensure the ADMIN_EMAIL from env exists as an admin too
  if (adminEmail && !ACCOUNTS.some((a) => a.email === adminEmail.toLowerCase())) {
    const existing = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!existing) {
      await User.create({
        name: 'Platform Admin',
        email: adminEmail.toLowerCase(),
        passwordHash: 'Admin@123',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      });
      logger.info(`Created ADMIN_EMAIL account: ${adminEmail}`);
    }
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await runAdminSeed();
      logger.info('Admin seed completed');
    } catch (err: any) {
      logger.error('Admin seed failed', { fileName: 'admin.seed.ts', error: err.message });
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}

export default runAdminSeed;
