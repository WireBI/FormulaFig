"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = void 0;
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyGoogleToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(401).json({ error: 'Invalid Google token payload' });
        }
        // Optional: Add strict email domain checking
        // if (!payload.email.endsWith('@formulafig.com')) {
        //   return res.status(403).json({ error: 'Unauthorized domain' });
        // }
        req.user = payload;
        next();
    }
    catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.verifyGoogleToken = verifyGoogleToken;
