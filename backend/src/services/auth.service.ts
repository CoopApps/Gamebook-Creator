import prisma from '../config/database';
import { PasswordUtil } from '../utils/password';
import { JwtUtil } from '../utils/jwt';
import { UnauthorizedError, ConflictError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    const { email, username, password } = input;

    // Validate password strength
    const passwordValidation = PasswordUtil.validateStrength(password);
    if (!passwordValidation.valid) {
      throw new BadRequestError(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.username === username.toLowerCase()) {
        throw new ConflictError('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await PasswordUtil.hash(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${user.email}`);

    // Generate tokens
    const { accessToken, refreshToken } = JwtUtil.generateTokenPair(user);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user has password (OAuth users don't)
    if (!user.passwordHash) {
      throw new UnauthorizedError(
        'This account uses OAuth login. Please sign in with your OAuth provider.'
      );
    }

    // Verify password
    const isValidPassword = await PasswordUtil.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate tokens
    const { accessToken, refreshToken } = JwtUtil.generateTokenPair({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const decoded = JwtUtil.verifyRefreshToken(refreshToken);

    // Find user
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

    // Generate new token pair
    const tokens = JwtUtil.generateTokenPair(user);

    logger.info(`Token refreshed for user: ${user.email}`);

    return tokens;
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            collaborations: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: { username?: string }) {
    const { username } = updates;

    // Check if username is taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username.toLowerCase(),
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictError('Username already taken');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username: username.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User profile updated: ${user.email}`);

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('User not found or uses OAuth');
    }

    // Verify current password
    const isValid = await PasswordUtil.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = PasswordUtil.validateStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new BadRequestError(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`
      );
    }

    // Hash new password
    const newPasswordHash = await PasswordUtil.hash(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    logger.info(`Password changed for user: ${user.email}`);

    return { success: true, message: 'Password changed successfully' };
  }
}

export default AuthService;
