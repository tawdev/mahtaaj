/**
 * ============================================================
 * REUSABLE INPUT VALIDATORS — express-validator
 * ============================================================
 * 
 * Usage:
 *   const { reservationValidators, handleValidationErrors } = require('../middleware/validators');
 *   router.post('/', reservationValidators, handleValidationErrors, controller);
 */

const { body, param, query, validationResult } = require('express-validator');

// ─────────────────────────────────────────────
// Middleware: Handle Validation Errors
// ─────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: 'fail',
            // Return all field errors — never reveal internal details
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }
    next();
};

// ─────────────────────────────────────────────
// Shared Field Validators (reuse across routes)
// ─────────────────────────────────────────────

/** Safe text field: strip HTML, trim, enforce length, alphanumeric + common punctuation */
const safeTextField = (field, label, { min = 2, max = 100 } = {}) =>
    body(field)
        .trim()
        .notEmpty().withMessage(`${label} est obligatoire`)
        .isLength({ min, max }).withMessage(`${label} doit contenir entre ${min} et ${max} caractères`)
        .customSanitizer((val) => val.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '')) // Strip HTML + dangerous chars
        .escape(); // HTML-encode remaining special chars

/** Email validator */
const emailField = (field = 'email') =>
    body(field)
        .trim()
        .notEmpty().withMessage('Email est obligatoire')
        .isEmail().withMessage('Adresse email invalide')
        .isLength({ max: 254 }).withMessage('Email trop long')
        .normalizeEmail() // Lowercase, remove dots from Gmail, etc.
        .customSanitizer((val) => val.replace(/<[^>]*>/g, '')); // Extra XSS strip

/** Phone number validator */
const phoneField = (field = 'phone', { required = true } = {}) => {
    let chain = body(field).trim();
    if (!required) chain = chain.optional({ checkFalsy: true });
    return chain
        .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Numéro de téléphone invalide (7-20 chiffres/caractères)')
        .customSanitizer((val) => val.replace(/[^+\d\s\-()\.\s]/g, ''));
};

/** Password validator */
const passwordField = (field = 'password') =>
    body(field)
        .notEmpty().withMessage('Mot de passe obligatoire')
        .isLength({ min: 8, max: 128 }).withMessage('Le mot de passe doit contenir entre 8 et 128 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir une majuscule, une minuscule, et un chiffre');

/** Date validator (YYYY-MM-DD) */
const dateField = (field, label) =>
    body(field)
        .trim()
        .notEmpty().withMessage(`${label} est obligatoire`)
        .isISO8601({ strict: true }).withMessage(`${label} doit être une date valide (YYYY-MM-DD)`)
        .toDate();

/** Positive integer (IDs, counts, quantities) */
const positiveIntField = (field, label) =>
    body(field)
        .notEmpty().withMessage(`${label} est obligatoire`)
        .isInt({ min: 1, max: 2147483647 }).withMessage(`${label} doit être un entier positif`)
        .toInt();

/** Numeric ID in URL params */
const numericIdParam = (param_name = 'id') =>
    param(param_name)
        .notEmpty()
        .isInt({ min: 1 }).withMessage('ID invalide')
        .toInt();

// ─────────────────────────────────────────────
// Form-Specific Validator Sets
// ─────────────────────────────────────────────

/** Contact form */
const contactValidators = [
    safeTextField('name', 'Nom', { min: 2, max: 100 }),
    emailField('email'),
    phoneField('phone', { required: false }),
    safeTextField('message', 'Message', { min: 5, max: 2000 }),
    // Honeypot: bots fill this, humans don't
    body('website')
        .isEmpty().withMessage('Bot détecté'),
];

/** User registration form */
const registerValidators = [
    safeTextField('name', 'Nom complet', { min: 2, max: 100 }),
    emailField('email'),
    passwordField('password'),
    body('password_confirmation')
        .custom((val, { req }) => {
            if (val !== req.body.password) throw new Error('Les mots de passe ne correspondent pas');
            return true;
        }),
];

/** User login form */
const loginValidators = [
    emailField('email'),
    body('password')
        .notEmpty().withMessage('Mot de passe obligatoire')
        .isLength({ max: 128 }).withMessage('Mot de passe trop long'),
];

/** Reservation / booking form */
const reservationValidators = [
    safeTextField('client_name', 'Nom du client', { min: 2, max: 100 }),
    emailField('client_email'),
    phoneField('client_phone'),
    positiveIntField('service_id', 'Service'),
    dateField('reservation_date', 'Date de réservation'),
    body('reservation_date').custom((val) => {
        if (new Date(val) < new Date()) throw new Error('La date de réservation ne peut pas être dans le passé');
        return true;
    }),
    safeTextField('address', 'Adresse', { min: 5, max: 300 }),
    body('notes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 }).withMessage('Notes trop longues (500 caractères max)')
        .customSanitizer((val) => val.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '')),
];

module.exports = {
    // Middleware
    handleValidationErrors,
    // Field builders (compose custom validators)
    safeTextField,
    emailField,
    phoneField,
    passwordField,
    dateField,
    positiveIntField,
    numericIdParam,
    // Ready-to-use form validators
    contactValidators,
    registerValidators,
    loginValidators,
    reservationValidators,
};
