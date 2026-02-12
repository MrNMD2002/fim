import crypto from 'crypto';

const TTL_MASTER_MS = 2 * 60 * 60 * 1000; // 2h cho link m3u8 gốc
const TTL_SEGMENT_MS = 10 * 60 * 1000;     // 10 phút cho segment

const store = new Map();

function genToken() {
  return crypto.randomBytes(24).toString('hex');
}

function now() {
  return Date.now();
}

export const streamTokenStore = {
  register(url, ttlMs = TTL_MASTER_MS) {
    const token = genToken();
    store.set(token, { url, expires: now() + ttlMs });
    return token;
  },

  get(token) {
    const entry = store.get(token);
    if (!entry) return null;
    if (entry.expires < now()) {
      store.delete(token);
      return null;
    }
    return entry.url;
  },

  registerSegment(url) {
    return this.register(url, TTL_SEGMENT_MS);
  },
};

export default streamTokenStore;
