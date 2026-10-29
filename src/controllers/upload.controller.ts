/**
 * @file upload.controller.ts
 * @description Generic staged upload handler (guest sell flow + misc images).
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { createdResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import { uploadStagedFiles } from '../services/upload.service';

export const uploadFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const result = await uploadStagedFiles(files);
  createdResponse(res, result, 'Files uploaded successfully');
});

export default { uploadFiles };
