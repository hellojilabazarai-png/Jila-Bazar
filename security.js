import { memStorage } from "./storage.js";
import { ATTEMPTS_KEY } from "./database.js";

export const MAX_ATTEMPTS = 5;

export const LOCKOUT_MS = 5 * 60 * 1000;

 // 5 minutes
export function loadAttempts() {
    try {
        return JSON.parse(memStorage.getItem(ATTEMPTS_KEY) || "{}");
    }
    catch {
        return {};
    }
}

export function saveAttempts(a) { memStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a)); }

export function checkLockout(key) {
    const a = loadAttempts();
    const rec = a[key];
    if (!rec)
        return { locked: false, remaining: 0 };
    if (rec.lockedUntil && rec.lockedUntil > Date.now()) {
        return { locked: true, remaining: Math.ceil((rec.lockedUntil - Date.now()) / 1000) };
    }
    if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
        delete a[key];
        saveAttempts(a); // lockout expired, reset
    }
    return { locked: false, remaining: 0 };
}

export function recordFailedAttempt(key) {
    const a = loadAttempts();
    const rec = a[key] || { count: 0 };
    rec.count += 1;
    if (rec.count >= MAX_ATTEMPTS)
        rec.lockedUntil = Date.now() + LOCKOUT_MS;
    a[key] = rec;
    saveAttempts(a);
    return rec;
}

export function resetAttempts(key) {
    const a = loadAttempts();
    delete a[key];
    saveAttempts(a);
}

export const isValidIndianMobile = (m) => /^[6-9]\d{9}$/.test(String(m || "").trim());

export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());

export const isStrongEnoughPassword = (p) => String(p || "").length >= 6;

/* ---------------------------- TOTP (Google Authenticator compatible) ----------------------------
   Real client-side 2FA using the standard TOTP algorithm (RFC 6238) — same one Google
   Authenticator, Authy, etc. use. No SMS/backend needed; works fully offline once set up.
*/
export const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(length = 20) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let bits = "";
    for (const b of bytes)
        bits += b.toString(2).padStart(8, "0");
    let secret = "";
    for (let i = 0; i + 5 <= bits.length; i += 5)
        secret += BASE32_ALPHABET[parseInt(bits.substr(i, 5), 2)];
    return secret;
}

export function base32ToBytes(base32) {
    const clean = String(base32 || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
    let bits = "";
    for (const ch of clean) {
        const val = BASE32_ALPHABET.indexOf(ch);
        if (val === -1)
            continue;
        bits += val.toString(2).padStart(5, "0");
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8)
        bytes.push(parseInt(bits.substr(i, 8), 2));
    return new Uint8Array(bytes);
}

export function formatSecretForDisplay(secret) {
    return (secret.match(/.{1,4}/g) || []).join(" ");
}

export async function totpAt(secret, timeMs, windowOffset = 0) {
    const keyBytes = base32ToBytes(secret);
    const counter = Math.floor(timeMs / 1000 / 30) + windowOffset;
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setUint32(0, 0, false);
    view.setUint32(4, counter, false);
    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, buf);
    const h = new Uint8Array(sig);
    const offset = h[h.length - 1] & 0xf;
    const bin = ((h[offset] & 0x7f) << 24) | ((h[offset + 1] & 0xff) << 16) | ((h[offset + 2] & 0xff) << 8) | (h[offset + 3] & 0xff);
    return String(bin % 1000000).padStart(6, "0");
}

export async function verifyTOTP(secret, code) {
    if (!secret || !code)
        return false;
    for (let w = -1; w <= 1; w++) {
        if ((await totpAt(secret, Date.now(), w)) === String(code).trim())
            return true;
    }
    return false;
}

/* ---------------------------- ACCOUNT RECOVERY (Admin) ----------------------------
   A one-time "Recovery Key" is generated when a Super Admin account is created.
   Only its SHA-256 hash is stored — the plain key is shown once and never again.
   If the admin loses their password or their phone (2FA), this key is the only
   way back in, since there is no email/SMS backend to send a reset link through.
*/
export function generateRecoveryKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
    let key = "";
    for (let i = 0; i < 20; i++)
        key += chars[Math.floor(Math.random() * chars.length)];
    return key.match(/.{1,5}/g).join("-");
}

export async function sha256Hex(text) {
    const enc = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
