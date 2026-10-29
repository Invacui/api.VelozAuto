/**
 * @file index.ts
 * @description Winston logger with console + daily rotating file transports.
 * @module Logger
 * @author VehicleMarket Backend
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'debug';
const isTest = process.env.NODE_ENV === 'test';

const dailyRotateTransport = new DailyRotateFile({
  filename: path.resolve(process.cwd(), 'logs', 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
  zippedArchive: true,
  level: isTest ? 'error' : logLevel,
});

const logger = winston.createLogger({
  level: isTest ? 'error' : logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vehicle-marketplace-api' },
  transports: [dailyRotateTransport],
});

if (!isTest) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, fileName, methodName, ...meta }) => {
          const loc = fileName ? ` [${fileName}${methodName ? `:${methodName}` : ''}]` : '';
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${level}${loc}: ${message}${extra}`;
        })
      ),
    })
  );
}

export default logger;
