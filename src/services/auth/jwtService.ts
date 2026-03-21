// Zero-Gas JWT Authentication Service

class JWTService {
    constructor(secret) {
        this.secret = secret;
    }

    generateToken(payload) {
        // Logic to generate JWT token
    }

    verifyToken(token) {
        // Logic to verify JWT token
    }
}

module.exports = new JWTService('your-secret-key');