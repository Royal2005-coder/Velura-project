import crypto from "node:crypto";
import { config } from "./config.js";

const JWT_SECRET = process.env.JWT_SECRET || config.supabaseAnonKey || "velura-fallback-secret-key-123456";

// Password Hashing (Timing-safe Scrypt)
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  try {
    const [salt, hash] = storedPassword.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch (err) {
    return false;
  }
}

// Custom JWT Implementation (HMAC SHA-256)
function base64UrlEncode(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
}

export function signJwt(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: "HS256", typ: "JWT" };
  const base64Header = base64UrlEncode(header);
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;
  const fullPayload = { ...payload, iat: now, exp };
  const base64Payload = base64UrlEncode(fullPayload);
  
  const signatureInput = `${base64Header}.${base64Payload}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest("base64url");
    
  return `${signatureInput}.${signature}`;
}

export function verifyJwt(token) {
  try {
    const [headerB64, payloadB64, signature] = token.split(".");
    if (!headerB64 || !payloadB64 || !signature) return null;
    
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(signatureInput)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payload = base64UrlDecode(payloadB64);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null; // Expired
    
    return payload;
  } catch (error) {
    return null;
  }
}
