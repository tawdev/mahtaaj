/**
 * ============================================================
 * BACKEND SECURITY MIDDLEWARE — Production-Ready Express Setup
 * ============================================================
 * 
 * Install dependencies:
 *   npm install helmet express-rate-limit express-mongo-sanitize xss-clean hpp cors express-validator
 * 
 * Usage in server.js / app.js:
 *   const { applySecurityMiddleware } = require('./middleware/security.middleware');
 *   applySecurityMiddleware(app);
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// ─────────────────────────────────────────────
// 1. HELMET — Secure HTTP Headers
// ─────────────────────────────────────────────
const helmetConfig = helmet({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Disable X-Powered-By header (hides Express fingerprint)
    hidePoweredBy: true,
    // Force HTTPS
    hsts: {
        maxAge: 31536000,        // 1 year
        includeSubDomains: true,
        preload: true,
    },
    // Prevent MIME sniffing
    noSniff: true,
    // Block XSS in old browsers
    xssFilter: true,
    // Disable DNS prefetching
    dnsPrefetchControl: { allow: false },
    // Restrict referrer header
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ─────────────────────────────────────────────
// 2. CORS — Restrict Allowed Origins
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

const corsConfig = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps in dev)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin '${origin}' is not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // Preflight cache: 24 hours
});

// ─────────────────────────────────────────────
// 3. RATE LIMITING — Brute Force & DDoS Protection
// ─────────────────────────────────────────────

/** General API rate limit — 100 requests per 15 minutes per IP */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Trop de requêtes. Réessayez dans 15 minutes.',
    },
    skip: (req) => process.env.NODE_ENV === 'test',
});

/** Strict limit for auth routes — 10 attempts per 15 minutes */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    },
    skip: (req) => process.env.NODE_ENV === 'test',
});

/** Strict limit for form submissions — 20 per hour per IP */
const formLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Trop de soumissions. Réessayez dans une heure.',
    },
});

// ─────────────────────────────────────────────
// 4. BODY SIZE LIMIT — Prevent Large Payload Attacks
// ─────────────────────────────────────────────
const bodyLimits = (app) => {
    const express = require('express');
    // JSON bodies: max 10kb (prevents large payload DoS)
    app.use(express.json({ limit: '10kb' }));
    // URL-encoded bodies (HTML forms): max 10kb
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));
};

// ─────────────────────────────────────────────
// 5. MONGO SANITIZE — Block NoSQL Injection
// ─────────────────────────────────────────────
// This strips keys that start with '$' or contain '.'
// Example blocked payload: { "email": { "$gt": "" } }
const mongoSanitizeConfig = mongoSanitize({
    replaceWith: '_',   // Replace illegal chars with '_' instead of removing
    allowDots: false,
    onSanitizeItem: (key, data, target) => {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[MongoSanitize] Blocked injection attempt on key: ${key}`);
        }
    },
});

// ─────────────────────────────────────────────
// 6. XSS CLEAN — Remove Script Tags from Body/Query/Params
// ─────────────────────────────────────────────
// Sanitizes req.body, req.query, req.params
// Example blocked: { "name": "<script>alert(1)</script>" } → { "name": "" }
const xssCleanMiddleware = xssClean();

// ─────────────────────────────────────────────
// 7. HPP — HTTP Parameter Pollution Protection
// ─────────────────────────────────────────────
// Prevents: ?sort=asc&sort=desc (picks last value)
const hppConfig = hpp({
    whitelist: ['filter', 'page', 'limit', 'sort'], // Allow these to be arrays
});

// ─────────────────────────────────────────────
// MAIN EXPORT — Apply All Middleware
// ─────────────────────────────────────────────
function applySecurityMiddleware(app) {
    // Core security headers
    app.use(helmetConfig);

    // CORS
    app.use(corsConfig);

    // Body size limits (must come before parsers or with them)
    bodyLimits(app);

    // NoSQL injection prevention
    app.use(mongoSanitizeConfig);

    // XSS payload stripping
    app.use(xssCleanMiddleware);

    // HTTP Parameter Pollution
    app.use(hppConfig);

    // General rate limit on all /api routes
    app.use('/api/', generalLimiter);

    return {
        authLimiter,  // export for use on specific auth routes
        formLimiter,  // export for use on form submission routes
    };
}

module.exports = { applySecurityMiddleware, authLimiter, formLimiter, generalLimiter };
