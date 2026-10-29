/**
 * @file storagePaths.ts
 * @description Storage path templates and file upload validation constants.
 * @module Constants
 * @author VehicleMarket Backend
 */

export const STORAGE_PATHS = {
  USERS: {
    PROFILE: 'users/profile/{userId}/{file}',
  },
  VEHICLES: {
    IMAGES: 'vehicles/{vehicleId}/images/{file}',
  },
  SELL_REQUESTS: {
    IMAGES: 'sell-requests/{sellRequestId}/images/{file}',
  },
  GENERIC: {
    /** Pre-submit uploads (guest sell flow) before the entity id exists. */
    STAGING: 'uploads/staging/{date}/{file}',
  },
  CHAT: {
    IMAGE: 'chat/{ticketId}/{file}',
  },
  DOCUMENTS: {
    GENERIC: 'documents/{entityType}/{entityId}/{file}',
  },
} as const;

export const ALLOWED_MIME_TYPES = {
  PHOTO: ['image/jpeg', 'image/png', 'image/webp'] as const,
  DOCUMENT: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const,
} as const;

export const FILE_SIZE_LIMITS = {
  PHOTO: 5 * 1024 * 1024, // 5 MB
  DOCUMENT: 10 * 1024 * 1024, // 10 MB
} as const;

export const buildStoragePath = (pattern: string, params: Record<string, string>): string => {
  let result = pattern;
  for (const [key, value] of Object.entries(params)) {
    const sanitized = key === 'file' ? value.replace(/[^a-zA-Z0-9._-]/g, '_') : value;
    result = result.replace(`{${key}}`, sanitized);
  }
  return result;
};

export const generateFileName = (originalName: string): string => {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safeName}`;
};
