/**
 * @file roles.helper.ts
 * @description Role helpers shared by services and middleware.
 * @module Helpers
 * @author VehicleMarket Backend
 */

import { UserRole } from '../../types';

/** Staff = EMPLOYEE or ADMIN — can access admin dashboards and request queues. */
export const isStaff = (role?: UserRole | null): boolean => role === 'EMPLOYEE' || role === 'ADMIN';

export default { isStaff };
