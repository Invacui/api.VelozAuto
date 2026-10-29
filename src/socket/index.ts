/**
 * @file index.ts
 * @description Socket.IO setup with JWT authentication middleware. Migrated
 *              from the reference project — chat mechanics are domain-neutral.
 * @module Socket
 * @author VehicleMarket Backend
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../logger/index';
import ChatTicket from '../models/ChatTicket.model';
import { UserRole } from '../types';

let io: Server;

export const initializeSocket = (httpServer: HttpServer): void => {
  const corsConfig = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  };

  io = new Server(httpServer, {
    cors: corsConfig,
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.cookie?.split('access_token=')[1]?.split(';')[0];

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    const secret = process.env.JWT_ACCESS_SECRET || '';
    if (!secret) {
      next(new Error('Server configuration error'));
      return;
    }

    try {
      const decoded = jwt.verify(token as string, secret) as { id: string; role: UserRole };
      socket.data.user = { id: decoded.id, role: decoded.role };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info('Socket connected', {
      fileName: 'socket/index.ts',
      methodName: 'connection',
      userId: user?.id,
      socketId: socket.id,
    });

    // Join user's personal room for targeted notifications
    if (user?.id) {
      socket.join(`user:${user.id}`);
    }

    // Admin room (super admins only — vendor employees do not receive
    // marketplace-wide request/chat notifications).
    if (user?.role === 'ADMIN') {
      socket.join('admin:notifications');
    }

    // Join chat-ticket rooms the caller has access to — best effort.
    // REST remains the source of truth; the socket only pushes state that
    // already changed server-side.
    if (user?.id) {
      (async () => {
        try {
          let ticketIds: string[] = [];
          if (user.role === 'ADMIN') {
            const tickets = await ChatTicket.find({
              $or: [{ assignedTo: user.id }, { user: user.id }],
            })
              .select('_id')
              .lean();
            ticketIds = tickets.map((t) => String(t._id));
          } else {
            const tickets = await ChatTicket.find({ user: user.id }).select('_id').lean();
            ticketIds = tickets.map((t) => String(t._id));
          }
          ticketIds.forEach((id) => socket.join(`ticket:${id}`));
        } catch (err) {
          logger.warn('Failed to join chat ticket rooms', {
            fileName: 'socket/index.ts',
            methodName: 'connection',
            userId: user?.id,
          });
        }
      })();
    }

    // Live-chat signals — clients emit these after the REST write succeeds;
    // the server merely fans them out to the ticket room.
    socket.on('ticket:typing', (data: { ticketId?: string; isTyping?: boolean }) => {
      const ticketId = data?.ticketId;
      if (!ticketId) return;
      socket.to(`ticket:${ticketId}`).emit('ticket:typing', {
        ticketId,
        isTyping: Boolean(data.isTyping),
        userId: user?.id,
      });
    });

    socket.on('ticket:read', (data: { ticketId?: string }) => {
      const ticketId = data?.ticketId;
      if (!ticketId) return;
      socket.to(`ticket:${ticketId}`).emit('ticket:read', {
        ticketId,
        userId: user?.id,
        readAt: new Date(),
      });
    });

    socket.on('join_ticket_room', (ticketId: string) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
        logger.info('Socket joined ticket room', {
          fileName: 'socket/index.ts',
          methodName: 'join_ticket_room',
          userId: user?.id,
          socketId: socket.id,
          ticketId,
        });
      }
    });

    socket.on('leave_ticket_room', (ticketId: string) => {
      if (ticketId) socket.leave(`ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', {
        fileName: 'socket/index.ts',
        methodName: 'disconnect',
        userId: user?.id,
        socketId: socket.id,
      });
    });
  });

  logger.info('Socket.IO initialized', {
    fileName: 'socket/index.ts',
    methodName: 'initializeSocket',
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

// ─────────────────────────────────────────────
// Broadcasting Helpers
// ─────────────────────────────────────────────

export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToAdmins = (event: string, data: any): void => {
  if (io) {
    io.to('admin:notifications').emit(event, data);
  }
};

/** Emit to everyone in a chat ticket room. */
export const emitToTicketRoom = (ticketId: string, event: string, data: any): void => {
  if (io) {
    io.to(`ticket:${ticketId}`).emit(event, data);
  }
};

export default { initializeSocket, getIO, emitToUser, emitToAdmins, emitToTicketRoom };
