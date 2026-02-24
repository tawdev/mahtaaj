/**
 * ============================================================
 * FRONTEND CLIENT-SIDE VALIDATORS
 * ============================================================
 * 
 * These are UI validators only — they give users immediate feedback.
 * NEVER rely on these alone. Always enforce rules on the backend too.
 * 
 * Usage:
 *   import { validateContact, validateRegister } from './validators';
 *   const errors = validateContact(formData);
 *   if (errors.length > 0) { setError(errors[0]); return; }
 */

// ─────────────────────────────────────────────
// Field Validators (return error message or null)
// ─────────────────────────────────────────────

/** Validate a plain text field */
export function validateText(value, label, { min = 2, max = 100 } = {}) {
    if (!value || !value.trim()) return `${label} est obligatoire`;
    if (value.trim().length < min) return `${label} doit contenir au moins ${min} caractères`;
    if (value.trim().length > max) return `${label} doit contenir au maximum ${max} caractères`;
    // Block obvious script injection attempts
    if (/<script|javascript:|on\w+\s*=/i.test(value)) return `${label} contient des caractères non autorisés`;
    return null;
}

/** Validate an email address */
export function validateEmail(email) {
    if (!email || !email.trim()) return 'Email est obligatoire';
    if (email.length > 254) return 'Email trop long';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return 'Adresse email invalide';
    if (/[<>'"`;]/.test(email)) return 'Email contient des caractères non autorisés';
    return null;
}

/** Validate a phone number */
export function validatePhone(phone, { required = false } = {}) {
    if (!phone || !phone.trim()) {
        return required ? 'Téléphone est obligatoire' : null;
    }
    if (!/^[+\d\s\-()\\.]{7,20}$/.test(phone.trim())) {
        return 'Numéro de téléphone invalide (7-20 chiffres)';
    }
    return null;
}

/** Validate a password */
export function validatePassword(password, { minLength = 8 } = {}) {
    if (!password) return 'Mot de passe obligatoire';
    if (password.length < minLength) return `Le mot de passe doit contenir au moins ${minLength} caractères`;
    if (password.length > 128) return 'Mot de passe trop long';
    if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/\d/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre';
    return null;
}

/** Validate password confirmation */
export function validatePasswordConfirmation(password, confirmation) {
    if (!confirmation) return 'Confirmation requise';
    if (password !== confirmation) return 'Les mots de passe ne correspondent pas';
    return null;
}

/** Validate a date (not in the past) */
export function validateFutureDate(dateStr, label = 'Date') {
    if (!dateStr) return `${label} est obligatoire`;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return `${label} invalide`;
    if (date < new Date()) return `${label} ne peut pas être dans le passé`;
    return null;
}

// ─────────────────────────────────────────────
// Form-Level Validators (returns array of errors)
// ─────────────────────────────────────────────

/** Validate the contact form */
export function validateContact(data) {
    const errors = [];
    const nameErr = validateText(data.name, 'Nom', { min: 2, max: 100 });
    const emailErr = validateEmail(data.email);
    const phoneErr = validatePhone(data.phone, { required: false });
    const msgErr = validateText(data.message, 'Message', { min: 5, max: 2000 });
    if (nameErr) errors.push(nameErr);
    if (emailErr) errors.push(emailErr);
    if (phoneErr) errors.push(phoneErr);
    if (msgErr) errors.push(msgErr);
    return errors; // empty = valid
}

/** Validate the user login form */
export function validateLogin(data) {
    const errors = [];
    const emailErr = validateEmail(data.email);
    if (emailErr) errors.push(emailErr);
    if (!data.password) errors.push('Mot de passe obligatoire');
    if (data.password && data.password.length > 128) errors.push('Mot de passe trop long');
    return errors;
}

/** Validate the user registration form */
export function validateRegister(data) {
    const errors = [];
    const nameErr = validateText(data.name, 'Nom complet', { min: 2, max: 100 });
    const emailErr = validateEmail(data.email);
    const passwordErr = validatePassword(data.password);
    const confirmErr = validatePasswordConfirmation(data.password, data.password_confirmation);
    if (nameErr) errors.push(nameErr);
    if (emailErr) errors.push(emailErr);
    if (passwordErr) errors.push(passwordErr);
    if (confirmErr) errors.push(confirmErr);
    return errors;
}

/** Validate a reservation form */
export function validateReservation(data) {
    const errors = [];
    const nameErr = validateText(data.client_name, 'Nom du client', { min: 2, max: 100 });
    const emailErr = validateEmail(data.client_email);
    const phoneErr = validatePhone(data.client_phone, { required: true });
    const dateErr = validateFutureDate(data.reservation_date, 'Date de réservation');
    const addrErr = validateText(data.address, 'Adresse', { min: 5, max: 300 });
    if (nameErr) errors.push(nameErr);
    if (emailErr) errors.push(emailErr);
    if (phoneErr) errors.push(phoneErr);
    if (dateErr) errors.push(dateErr);
    if (addrErr) errors.push(addrErr);
    if (data.notes && data.notes.length > 500) errors.push('Notes trop longues (500 caractères max)');
    return errors;
}
