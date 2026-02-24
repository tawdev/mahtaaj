/**
 * ============================================================
 * EXAMPLE SECURE ROUTE — Reservation Form
 * ============================================================
 * 
 * This demonstrates the full security pipeline for a reservation.
 * Every layer is labeled with what it protects against.
 * 
 * Security layers applied (in order):
 *   1. formLimiter       → brute force / spam
 *   2. mongoSanitize      → NoSQL injection (applied globally)
 *   3. xssClean           → XSS in req.body (applied globally)
 *   4. reservationValidators → input validation + sanitization
 *   5. handleValidationErrors → reject invalid payloads early
 *   6. Controller         → business logic with parameterized queries
 */

const express = require('express');
const router = express.Router();
const { formLimiter } = require('../middleware/security.middleware');
const {
    reservationValidators,
    handleValidationErrors,
    numericIdParam,
} = require('../middleware/validators');

// ─────────────────────────────────────────────
// Simulated DB model (replace with your Mongoose model)
// ─────────────────────────────────────────────
// const Reservation = require('../models/Reservation');

// ─────────────────────────────────────────────
// POST /api/reservations — Create a new reservation
// ─────────────────────────────────────────────
router.post(
    '/',
    formLimiter,             // Layer 1: max 20 submissions/hour per IP
    reservationValidators,   // Layer 2-3: validate + sanitize all fields
    handleValidationErrors,  // Layer 4: reject if any field is invalid (422)
    async (req, res) => {
        try {
            // At this point, req.body is:
            //   ✅ HTML-stripped (xss-clean)
            //   ✅ NoSQL operator-free (mongo-sanitize)
            //   ✅ Length-validated
            //   ✅ Type-coerced (dates → Date, ints → Number)
            const {
                client_name,
                client_email,
                client_phone,
                service_id,
                reservation_date,
                address,
                notes,
            } = req.body;

            // ─────────────────────────────────────
            // EXAMPLE: Mongoose model save
            //   Uses parameterized queries internally — zero SQL/NoSQL injection risk
            // ─────────────────────────────────────
            /*
            const reservation = await Reservation.create({
              clientName: client_name,
              clientEmail: client_email,
              clientPhone: client_phone,
              serviceId: service_id,
              date: reservation_date,
              address,
              notes: notes || '',
              status: 'pending',
              createdAt: new Date(),
            });
            */

            // ─────────────────────────────────────
            // EXAMPLE: Supabase insert (your stack)
            //   Also uses parameterized queries — safe
            // ─────────────────────────────────────
            /*
            const { data, error } = await supabase.from('reservations').insert([{
              client_name,
              client_email,
              client_phone,
              service_id,
              reservation_date,
              address,
              notes: notes || null,
              status: 'pending',
            }]);
            if (error) throw error;
            */

            // Return minimal success response — never echo back raw input
            return res.status(201).json({
                status: 'success',
                message: 'Réservation créée avec succès',
                data: {
                    // Only return non-sensitive confirmation data
                    reservationDate: reservation_date,
                    service: service_id,
                },
            });
        } catch (err) {
            // Log full error internally
            if (process.env.NODE_ENV === 'development') {
                console.error('[ReservationRoute] Error:', err);
            }
            // Return generic error to client — never expose DB errors
            return res.status(500).json({
                status: 'error',
                message: 'Erreur interne. Veuillez réessayer.',
            });
        }
    }
);

// ─────────────────────────────────────────────
// GET /api/reservations/:id — Get reservation by ID
// ─────────────────────────────────────────────
router.get(
    '/:id',
    numericIdParam('id'),    // Validate ID is a positive integer
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params; // Already coerced to Number by validator

            // With Mongoose:
            // const reservation = await Reservation.findById(id).select('-__v');

            return res.status(200).json({
                status: 'success',
                data: { id }, // Replace with real DB result
            });
        } catch (err) {
            return res.status(500).json({ status: 'error', message: 'Erreur interne.' });
        }
    }
);

module.exports = router;
