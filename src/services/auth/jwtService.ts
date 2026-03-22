// Zero-Gas JWT Authentication Service
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production.');
}

class JWTService {
    private readonly secret: string;

    constructor(jwtSecret: string) {
        this.secret = jwtSecret;
    }

    generateToken(payload: object, options?: SignOptions): string {
        return jwt.sign(payload, this.secret, { algorithm: 'HS256', ...options });
    }

    verifyToken(token: string): JwtPayload | string {
        return jwt.verify(token, this.secret, { algorithms: ['HS256'] });
    }
}

export default new JWTService(secret ?? 'change-me-in-development');
