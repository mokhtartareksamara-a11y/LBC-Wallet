// Zero-Gas JWT Authentication Service
import jwt, { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  walletAddress: string;
  role: 'user' | 'founder' | 'admin';
  [key: string]: unknown;
}

class JWTService {
  private readonly secret: string;

  constructor(secret: string) {
    if (!secret) {
      throw new Error('JWT_SECRET must be provided');
    }
    this.secret = secret;
  }

  generateToken(payload: TokenPayload, options?: SignOptions): string {
    return jwt.sign(payload, this.secret, { expiresIn: '24h', ...options });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error(
    'JWT_SECRET environment variable is not set. ' +
    'Set it in .env.local before starting the application.'
  );
}

export default new JWTService(secret);
