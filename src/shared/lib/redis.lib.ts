/**
 * @file redis.lib.ts
 * @description Simple cache helpers over the configured Redis/in-memory backend.
 * @module Lib
 * @author VehicleMarket Backend
 */

import { redisClient } from '../../config/redis';

export const get = async (key: string): Promise<string | null> => redisClient.get(key);

export const set = async (key: string, value: string, ttl?: number): Promise<void> => {
  await redisClient.set(key, value, ttl);
};

export const del = async (key: string): Promise<void> => redisClient.del(key);

export const setnx = async (key: string, value: string, ttl?: number): Promise<boolean> => {
  const existing = await redisClient.get(key);
  if (existing !== null) return false;
  await redisClient.set(key, value, ttl);
  return true;
};

export const getJson = async <T = any>(key: string): Promise<T | null> => {
  const raw = await redisClient.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setJson = async (key: string, value: unknown, ttl?: number): Promise<void> => {
  await redisClient.set(key, JSON.stringify(value), ttl);
};

export default { get, set, del, setnx, getJson, setJson };
