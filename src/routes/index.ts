/**
 * @file index.ts
 * @description Aggregates every feature router under the /api/v1 prefix.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import vehicleRoutes from './vehicle.routes';
import buyRequestRoutes from './buyRequest.routes';
import sellRequestRoutes from './sellRequest.routes';
import wishlistRoutes from './wishlist.routes';
import masterRoutes from './master.routes';
import chatRoutes from './chat.routes';
import adminRoutes from './admin.routes';
import contentRoutes from './content.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/buy-requests', buyRequestRoutes);
router.use('/sell-requests', sellRequestRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/master', masterRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/content', contentRoutes);
router.use('/uploads', uploadRoutes);

export default router;
