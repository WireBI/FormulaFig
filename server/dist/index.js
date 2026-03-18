"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const queryBuilder_1 = require("./lib/queryBuilder");
const db_1 = require("./lib/db");
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express_1.default.json());
// Main Self-Service Reporting Endpoint (Protected)
app.post('/api/reports/self-service', auth_1.verifyGoogleToken, async (req, res) => {
    try {
        const config = req.body;
        if (!config || !config.tableName || !config.dimensions) {
            return res.status(400).json({ error: 'Missing required query configuration fields.' });
        }
        const { sql, params } = (0, queryBuilder_1.buildQuery)(config);
        const result = await (0, db_1.query)(sql, params);
        res.json({
            data: result.rows,
            rowCount: result.rowCount,
            metadata: { executedSql: sql } // Optional for debugging
        });
    }
    catch (error) {
        console.error('Self-Service API Error:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error?.message });
    }
});
// Health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await (0, db_1.closeDb)();
    process.exit(0);
});
