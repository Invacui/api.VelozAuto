/**
 * @file storage.lib.ts
 * @description Storage service abstraction supporting S3-compatible storage
 *              with a local filesystem fallback for development.
 * @module Lib
 * @author VehicleMarket Backend
 */

import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../../logger/index';
import envConfig from '../../config/environment';

type StorageConfig = ReturnType<typeof envConfig.getStorageConfig>;

class StorageService {
  private static instance: StorageService;
  private s3Client: S3Client | null = null;
  private config: StorageConfig | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public initialize(config: StorageConfig): void {
    this.config = config;
    this.initialized = true;

    if (config.mode === 's3' && config.s3.endpoint && config.s3.accessKeyId && config.s3.secretAccessKey) {
      this.s3Client = new S3Client({
        region: config.s3.region,
        endpoint: config.s3.endpoint,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
        forcePathStyle: true,
      });
      logger.info('[storage] Initialised S3-compatible storage client', {
        fileName: 'storage.lib.ts',
        methodName: 'initialize',
        bucket: config.s3.bucket,
      });
    } else {
      logger.info('[storage] Using local filesystem storage', {
        fileName: 'storage.lib.ts',
        methodName: 'initialize',
        uploadPath: config.local.uploadPath,
      });
    }
  }

  public isLocalMode(): boolean {
    return !this.config || this.config.mode !== 's3' || !this.config.s3.endpoint;
  }

  public async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    this.ensureInitialized();
    if (this.isLocalMode()) {
      return this.uploadToLocal(key, body);
    }
    return this.uploadToS3(key, body, contentType);
  }

  public async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    this.ensureInitialized();
    if (this.isLocalMode()) {
      return this.getLocalUrl(key);
    }
    return this.getS3SignedUrl(key, expiresIn);
  }

  public async delete(key: string): Promise<void> {
    this.ensureInitialized();
    if (this.isLocalMode()) {
      return this.deleteFromLocal(key);
    }
    return this.deleteFromS3(key);
  }

  private async uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
    const bucket = this.config!.s3.bucket;
    await this.s3Client!.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
    );
    return this.getS3PublicUrl(key);
  }

  private async getS3SignedUrl(key: string, expiresIn: number): Promise<string> {
    const bucket = this.config!.s3.bucket;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.s3Client!, command, { expiresIn });
  }

  private getS3PublicUrl(key: string): string {
    const baseUrl = this.config!.s3.publicUrl.replace(/\/+$/, '');
    const bucket = this.config!.s3.bucket;
    return `${baseUrl}/object/public/${bucket}/${key}`;
  }

  private async deleteFromS3(key: string): Promise<void> {
    const bucket = this.config!.s3.bucket;
    await this.s3Client!.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  private async uploadToLocal(key: string, body: Buffer): Promise<string> {
    const uploadPath = this.config!.local.uploadPath;
    const fullPath = path.resolve(process.cwd(), uploadPath, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, body);
    return this.getLocalUrl(key);
  }

  private getLocalUrl(key: string): string {
    const serverConfig = envConfig.getServerConfig();
    const port = serverConfig.port;
    const base = serverConfig.baseUrl.includes('localhost')
      ? `http://localhost:${port}`
      : serverConfig.baseUrl;
    return `${base}/uploads/${key}`;
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const uploadPath = this.config!.local.uploadPath;
    const fullPath = path.resolve(process.cwd(), uploadPath, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // ignore missing files
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      this.initialize(envConfig.getStorageConfig());
    }
  }
}

export const storageService = StorageService.getInstance();
export default storageService;
