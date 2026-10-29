/**
 * @file upload.service.ts
 * @description Generic staged upload service — used by the guest sell flow
 *              before the entity exists, and by chat image messages.
 * @module Services
 * @author VehicleMarket Backend
 */

import { storageService } from '../shared/lib/storage.lib';
import { STORAGE_PATHS, buildStoragePath, generateFileName } from '../constants/storagePaths';
import { AppError } from '../utils/AppError';
import envConfig from '../config/environment';

export interface UploadedFile {
  url: string;
  s3Key: string;
  name: string;
  size: number;
  mimetype: string;
}

const dateSegment = (): string => new Date().toISOString().slice(0, 10);

export const uploadStagedFiles = async (files: Express.Multer.File[]): Promise<UploadedFile[]> => {
  if (!files || files.length === 0) {
    throw new AppError('No files uploaded.', 400);
  }
  const { maxImagesPerVehicle } = envConfig.getStorageConfig();
  if (files.length > Math.min(maxImagesPerVehicle, 6)) {
    throw new AppError(`You can upload at most 6 files per request.`, 400);
  }

  const results: UploadedFile[] = [];
  for (const file of files) {
    const key = buildStoragePath(STORAGE_PATHS.GENERIC.STAGING, {
      date: dateSegment(),
      file: generateFileName(file.originalname),
    });
    const url = await storageService.upload(key, file.buffer, file.mimetype);
    results.push({
      url,
      s3Key: key,
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  }
  return results;
};

/** Upload a single vehicle image to its final location. */
export const uploadVehicleImage = async (
  vehicleId: string,
  file: Express.Multer.File
): Promise<{ url: string; s3Key: string }> => {
  const key = buildStoragePath(STORAGE_PATHS.VEHICLES.IMAGES, {
    vehicleId,
    file: generateFileName(file.originalname),
  });
  const url = await storageService.upload(key, file.buffer, file.mimetype);
  return { url, s3Key: key };
};

/** Upload a single chat image. */
export const uploadChatImage = async (
  ticketId: string,
  file: Express.Multer.File
): Promise<{ url: string; s3Key: string }> => {
  const key = buildStoragePath(STORAGE_PATHS.CHAT.IMAGE, {
    ticketId,
    file: generateFileName(file.originalname),
  });
  const url = await storageService.upload(key, file.buffer, file.mimetype);
  return { url, s3Key: key };
};

export default { uploadStagedFiles, uploadVehicleImage, uploadChatImage };
