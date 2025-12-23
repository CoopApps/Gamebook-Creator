import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import prisma from '../config/database';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

/**
 * Authentication middleware - Requires valid JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const decoded = JwtUtil.verifyAccessToken(token);

    // Optional: Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - Doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    // Try to verify token
    try {
      const decoded = JwtUtil.verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      }
    } catch (error) {
      // Invalid token, but that's okay for optional auth
      // Continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns the resource
 * Must be used after authenticate middleware
 */
export const checkResourceOwnership = (resourceUserIdField: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

      if (!resourceUserId) {
        throw new UnauthorizedError('Resource ownership cannot be determined');
      }

      if (resourceUserId !== req.user.id) {
        throw new UnauthorizedError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authenticate;
