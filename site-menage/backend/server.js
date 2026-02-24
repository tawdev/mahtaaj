/**
 * ============================================================
 * EXAMPLE SERVER ENTRY POINT — Shows Full Security Setup
 * ============================================================
 * 
 * npm install express helmet express-rate-limit express-mongo-sanitize xss-clean hpp cors express-validator
 */

const express = require('express');
const { applySecurityMiddleware } = require('./middleware/security.middleware');

const app = express();

// ✅ Apply ALL security middleware in one call
const { authLimiter, formLimiter } = applySecurityMiddleware(app);

// ─────────────────────────────────────────────
// Routes — Apply limiters where needed
// ─────────────────────────────────────────────
const reservationRouter = require('./routes/reservation.route');

// Auth routes — strict rate limit
// app.use('/api/auth', authLimiter, require('./routes/auth.route'));

// Reservation routes — form limiter applied inside the route
app.use('/api/reservations', reservationRouter);

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }
    // Never reveal error details in production
    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Server running on port ${PORT}`);
    }
});

module.exports = app;
