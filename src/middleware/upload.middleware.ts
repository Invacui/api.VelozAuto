/**
 * @file upload.middleware.ts
 * @description Multer-based file upload middleware factory. Supports "photo"
 *              and "document" categories with MIME whitelisting and size
 *              limits. `files(category, maxCount)` handles multi-file arrays.
 * @module Middleware
 * @author VehicleMarket Backend
 */

import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from '../constants/storagePaths';
import { AppError } from '../utils/AppError';

type UploadCategory = 'photo' | 'document';

const MIME_MAP: Record<UploadCategory, readonly string[]> = {
  photo: ALLOWED_MIME_TYPES.PHOTO,
  document: ALLOWED_MIME_TYPES.DOCUMENT,
};

const SIZE_MAP: Record<UploadCategory, number> = {
  photo: FILE_SIZE_LIMITS.PHOTO,
  document: FILE_SIZE_LIMITS.DOCUMENT,
};

const makeMiddleware = (
  multerMiddleware: (req: Request, res: Response, cb: (err?: any) => void) => void,
  maxSize: number,
  allowedMimes: readonly string[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    multerMiddleware(req, res, (err: any) => {
      if (err) {
        if (err instanceof MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            next(
              new AppError(
                `File size exceeds the maximum allowed (${maxSize / 1024 / 1024} MB).`,
                400
              )
            );
            return;
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            next(
              new AppError(
                `Too many files or unexpected field name. Allowed types: ${allowedMimes.join(', ')}`,
                400
              )
            );
            return;
          }
          next(new AppError(`Upload error: ${err.message}`, 400));
          return;
        }
        next(err);
        return;
      }
      next();
    });
  };
};

const fileFilter = (allowedMimes: readonly string[]) =>
  (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`,
          400
        )
      );
    }
  };

/** Single-file upload on field `file`. */
export const upload = (category: UploadCategory) => {
  const allowedMimes = MIME_MAP[category];
  const maxSize = SIZE_MAP[category];
  const multerMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: fileFilter(allowedMimes),
  }).single('file');
  return makeMiddleware(multerMiddleware, maxSize, allowedMimes);
};

/** Multi-file upload on field `files` (up to maxCount). */
export const uploadFiles = (category: UploadCategory, maxCount: number) => {
  const allowedMimes = MIME_MAP[category];
  const maxSize = SIZE_MAP[category];
  const multerMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize, files: maxCount },
    fileFilter: fileFilter(allowedMimes),
  }).array('files', maxCount);
  return makeMiddleware(multerMiddleware, maxSize, allowedMimes);
};

export default upload;
