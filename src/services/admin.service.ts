/**
 * @file admin.service.ts
 * @description Admin service — dashboard analytics and user management.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as userDao from '../dao/user.dao';
import * as vehicleDao from '../dao/vehicle.dao';
import * as buyRequestDao from '../dao/buyRequest.dao';
import * as sellRequestDao from '../dao/sellRequest.dao';
import * as chatTicketDao from '../dao/chatTicket.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const getDashboard = async (actor: { id: string; role: string }) => {
  const isAdmin = actor.role === 'ADMIN';
  const vehicleFilter = isAdmin ? {} : { createdBy: actor.id };

  const [
    vehicleStats,
    buyByStatus,
    sellByStatus,
    totalUsers,
    openChats,
    recentBuy,
    recentSell,
  ] = await Promise.all([
    vehicleDao.aggregateStats(vehicleFilter),
    isAdmin ? buyRequestDao.countByStatus('NEW') : Promise.resolve(0),
    isAdmin ? sellRequestDao.countPending() : Promise.resolve(0),
    isAdmin ? userDao.countAll({}) : Promise.resolve(0),
    isAdmin ? chatTicketDao.countOpen() : Promise.resolve(0),
    isAdmin ? buyRequestDao.findRecent(5) : Promise.resolve([]),
    isAdmin ? sellRequestDao.findRecent(5) : Promise.resolve([]),
  ]);

  const statusMap: Record<string, number> = {};
  (vehicleStats.byStatus || []).forEach((s: any) => {
    statusMap[s._id] = s.count;
  });
  const categoryMap: Record<string, number> = {};
  (vehicleStats.byCategory || []).forEach((s: any) => {
    categoryMap[s._id] = s.count;
  });

  const since = new Date(Date.now() - WEEK_MS);
  const [vehiclesThisWeek, buyThisWeek, sellThisWeek, usersThisWeek] = await Promise.all([
    vehicleDao.countAll({ createdAt: { $gte: since }, ...vehicleFilter }),
    isAdmin ? buyRequestDao.countAll({ createdAt: { $gte: since } }) : Promise.resolve(0),
    isAdmin ? sellRequestDao.countAll({ createdAt: { $gte: since } }) : Promise.resolve(0),
    isAdmin ? userDao.countAll({ createdAt: { $gte: since } }) : Promise.resolve(0),
  ]);

  const activity = !isAdmin
    ? []
    : [
        ...recentBuy.map((r: any) => ({
          type: 'BUY_REQUEST',
          id: String(r._id),
          title: `${r.name} requested a buy quote`,
          subtitle: r.vehicle ? `${r.vehicle.brandName || ''} ${r.vehicle.model || ''}`.trim() : '',
          at: r.createdAt,
          link: `/admin/buy-requests/${r._id}`,
        })),
        ...recentSell.map((r: any) => ({
          type: 'SELL_REQUEST',
          id: String(r._id),
          title: `${r.name} submitted a sell request`,
          subtitle: `${r.brandName || ''} ${r.model || ''}`.trim(),
          at: r.createdAt,
          link: `/admin/sell-requests/${r._id}`,
        })),
      ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 8);

  return {
    vehicles: {
      total: vehicleStats.totals?.total || 0,
      totalViews: vehicleStats.totals?.totalViews || 0,
      avgPrice: Math.round(vehicleStats.totals?.avgPrice || 0),
      byStatus: statusMap,
      byCategory: categoryMap,
      active: statusMap.ACTIVE || 0,
      sold: statusMap.SOLD || 0,
      draft: statusMap.DRAFT || 0,
    },
    requests: {
      buyNew: buyByStatus,
      sellPending: sellByStatus,
      buyThisWeek: buyThisWeek,
      sellThisWeek: sellThisWeek,
    },
    users: { total: totalUsers, thisWeek: usersThisWeek },
    chats: { open: openChats },
    growth: { vehiclesThisWeek, buyThisWeek, sellThisWeek, usersThisWeek },
    activity,
  };
};

// =====================
// Users
// =====================

export const listUsers = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await userDao.findAll(filter, pagination);
  const totalItems = await userDao.countAll(filter);
  return { data, totalItems };
};

export const getUser = async (id: string) => {
  const user = await userDao.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export const updateUser = async (
  id: string,
  data: Record<string, any>,
  actorId: string
) => {
  const user = await userDao.findById(id);
  if (!user) throw new AppError('User not found.', 404);

  // Guard: cannot demote/deactivate the last remaining admin, or yourself.
  if (user.role === 'ADMIN') {
    const isDemoting = data.role && data.role !== 'ADMIN';
    const isDeactivating = data.isActive === false;
    if (isDemoting || isDeactivating) {
      if (String(user._id) === actorId) {
        throw new AppError('You cannot change your own admin role or deactivate yourself.', 400);
      }
      const admins = await userDao.countAdmins();
      if (admins <= 1) {
        throw new AppError('At least one admin must remain active.', 400);
      }
    }
  }

  const patch: Record<string, any> = {};
  if (data.role) patch.role = data.role;
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.name) patch.name = data.name;
  if (data.phone) patch.phone = data.phone;

  const nextRole = data.role ?? user.role;
  const nextIsVendor =
    nextRole === 'EMPLOYEE' ? (data.isVendor !== undefined ? data.isVendor : !!user.isVendor) : false;

  if (nextRole === 'EMPLOYEE' && nextIsVendor) {
    const companyName = String(data.companyName ?? user.companyName ?? '').trim();
    if (!companyName) {
      throw new AppError('Company name is required for vendor employees.', 422);
    }
    patch.isVendor = true;
    patch.companyName = companyName;
  } else {
    patch.isVendor = false;
    patch.companyName = null;
  }

  return userDao.updateById(id, patch);
};

export default { getDashboard, listUsers, getUser, updateUser };
