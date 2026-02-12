import crypto from 'crypto';
import config from '../config.js';
import keyStore from '../services/KeyStore.js';

const ALG = 'sha256';

/** Chỉ dùng key từ web quản lý (KeyStore), không dùng key từ env */
function getValidKeys() {
  return keyStore.getActiveKeys();
}
const COOKIE_NAME = 'access_token';
const HEADER_NAME = 'x-access-token';

function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  return Buffer.from(b64, 'base64');
}

function signPayloadString(payloadB64) {
  const hmac = crypto.createHmac(ALG, config.sessionSecret);
  hmac.update(payloadB64);
  return base64UrlEncode(hmac.digest());
}

function createToken(key) {
  const exp = Date.now() + config.sessionMaxAgeDays * 24 * 60 * 60 * 1000;
  const payload = { key, exp };
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const signature = signPayloadString(payloadB64);
  return `${payloadB64}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  try {
    if (signPayloadString(payloadB64) !== sig) return null;
    const payloadJson = base64UrlDecode(payloadB64).toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (payload.exp < Date.now()) return null;
    if (!getValidKeys().includes(payload.key)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  const out = {};
  cookieHeader.split(';').forEach((part) => {
    const [key, ...v] = part.trim().split('=');
    if (key) out[key.trim()] = decodeURIComponent(v.join('=').trim());
  });
  return out;
}

/**
 * Middleware: nếu bật requireAccessKey thì chỉ cho qua khi có token hợp lệ (cookie hoặc header).
 * Route /api/auth/* luôn được bỏ qua.
 */
export function authMiddleware(req, res, next) {
  const requireAccessKey = keyStore.getActiveKeys().length > 0;
  if (!requireAccessKey) return next();

  const path = req.path.replace(config.apiPrefix, '') || '/';
  if (path === '/auth/verify' || path === '/auth/check') return next();
  if (path.startsWith('/admin/')) return next();

  const cookies = parseCookies(req.get('cookie'));
  const token = cookies[COOKIE_NAME] ?? req.get(HEADER_NAME);
  const payload = verifyToken(token);

  if (payload) return next();
  res.status(401).json({ error: 'Access key required or invalid.' });
}

/**
 * Tạo token và set cookie cho response.
 */
export function setAuthCookie(res, key) {
  const token = createToken(key);
  const maxAge = config.sessionMaxAgeDays * 24 * 60 * 60;
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAge * 1000,
  });
}

export { createToken, verifyToken, COOKIE_NAME, HEADER_NAME };
