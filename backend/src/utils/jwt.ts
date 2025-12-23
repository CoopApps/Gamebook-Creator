import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors';

interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

interface RefreshTokenPayload {
  userId: string;
}

export class JwtUtil {
  private static accessTokenSecret = process.env.JWT_SECRET!;
  private static refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  private static accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
  private static refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Generate access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    if (!this.accessTokenSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'gamebook-api',
      audience: 'gamebook-client',
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: RefreshTokenPayload): string {
    if (!this.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'gamebook-api',
      audience: 'gamebook-client',
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(user: { id: string; email: string; username: string }) {
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'gamebook-api',
        audience: 'gamebook-client',
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'gamebook-api',
        audience: 'gamebook-client',
      }) as RefreshTokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(token: string): Date | null {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration < new Date();
  }
}

export default JwtUtil;
