/**
 * ============================================================
 * FRONTEND SANITIZATION UTILITIES
 * ============================================================
 * 
 * Provides XSS protection for any text displayed in the DOM.
 * Works WITHOUT DOMPurify (no extra dep needed for React).
 * 
 * In React, JSX auto-escapes all string interpolations by default.
 * Use these helpers ONLY when:
 *   1. You store user text in state and display it later
 *   2. You use dangerouslySetInnerHTML (avoid if possible)
 *   3. You insert content into the DOM imperatively (e.g., via ref)
 */

// ─────────────────────────────────────────────
// 1. STRIP HTML TAGS — Remove any injected HTML/script
// ─────────────────────────────────────────────
/**
 * Removes all HTML tags from a string.
 * Example: "<script>alert(1)</script>hello" → "hello"
 */
export function stripHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '');
}

// ─────────────────────────────────────────────
// 2. ESCAPE HTML ENTITIES — Encode special chars
// ─────────────────────────────────────────────
/**
 * Encodes &, <, >, ", ' into HTML entities.
 * Use this when rendering user content into innerHTML (avoid dangerouslySetInnerHTML!).
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ─────────────────────────────────────────────
// 3. SANITIZE TEXT INPUT — Strip HTML + trim + truncate
// ─────────────────────────────────────────────
/**
 * Cleans a user input string for safe storage.
 * - Strips all HTML tags
 * - Trims whitespace
 * - Truncates to maxLength
 * 
 * @param {string} str - Raw user input
 * @param {number} maxLength - Maximum allowed length (default: 500)
 */
export function sanitizeInput(str, maxLength = 500) {
    if (typeof str !== 'string') return '';
    return stripHtml(str).trim().slice(0, maxLength);
}

// ─────────────────────────────────────────────
// 4. SANITIZE OBJECT — Clean all string fields in a form object
// ─────────────────────────────────────────────
/**
 * Recursively sanitizes all string values in a plain object.
 * 
 * @param {object} obj - The form data object
 * @param {object} limits - Per-field max lengths: { fieldName: maxLength }
 * 
 * Usage:
 *   const clean = sanitizeFormData(formData, { name: 100, message: 2000 });
 */
export function sanitizeFormData(obj, limits = {}) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            const maxLen = limits[key] || 500;
            result[key] = sanitizeInput(value, maxLen);
        } else {
            result[key] = value; // Pass non-strings as-is (numbers, booleans)
        }
    }
    return result;
}

// ─────────────────────────────────────────────
// 5. SAFE RENDER — Use instead of dangerouslySetInnerHTML
// ─────────────────────────────────────────────
/**
 * Returns a sanitized __html object for dangerouslySetInnerHTML.
 * ALWAYS use this instead of { __html: rawUserInput }.
 * 
 * Strips all tags EXCEPT a small safe whitelist (b, i, br, p, strong, em).
 * 
 * Usage (only when rich text rendering is truly required):
 *   <div dangerouslySetInnerHTML={safeHtml(userContent)} />
 */
export function safeHtml(str) {
    if (typeof str !== 'string') return { __html: '' };
    // Only allow: <b>, <i>, <br>, <p>, <strong>, <em>
    const allowTags = /<(?!\/?(b|i|br|p|strong|em)\b)[^>]+>/gi;
    const cleaned = str.replace(allowTags, '');
    return { __html: cleaned };
}

// ─────────────────────────────────────────────
// 6. BLOCK NOSQL OPERATORS — Frontend defense
// ─────────────────────────────────────────────
/**
 * Removes MongoDB operator keys from a nested object.
 * This is a LAST-LINE DEFENSE — your backend should also use mongo-sanitize.
 * Blocks payloads like: { email: { "$gt": "" } }
 */
export function stripNoSQLOperators(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    const safe = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip keys starting with $ (MongoDB operators)
        if (key.startsWith('$')) continue;
        // Skip keys containing dots (field traversal)
        if (key.includes('.')) continue;
        safe[key] = typeof value === 'object' ? stripNoSQLOperators(value) : value;
    }
    return safe;
}

// ─────────────────────────────────────────────
// 7. UTILITY: Sanitize a single field on change
// ─────────────────────────────────────────────
/**
 * React onChange handler wrapper that sanitizes input on the fly.
 * 
 * Usage:
 *   onChange={(e) => handleSafeChange(e, setFormData, { name: 100 })}
 */
export function handleSafeChange(e, setFormData, limits = {}) {
    const { name, value } = e.target;
    const maxLen = limits[name] || 500;
    const clean = sanitizeInput(value, maxLen);
    setFormData((prev) => ({ ...prev, [name]: clean }));
}
