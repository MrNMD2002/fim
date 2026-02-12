/**
 * Sanitize response trước khi gửi ra client: không lộ URL nguồn (ophim, img.ophim, ...).
 * - thumb_url, poster_url → chỉ giữ path (để client gọi /api/image?path=...)
 * - link_m3u8, link, url trong server_data → xóa (client lấy stream qua token)
 */
const SENSITIVE_HOSTS = ['ophim', 'ophim1', 'ophim17', 'img.ophim'];

function isExternalUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('http')) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return SENSITIVE_HOSTS.some((h) => host.includes(h));
  } catch {
    return false;
  }
}

function urlToPath(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
    return path || '';
  } catch {
    return '';
  }
}

function sanitizeValue(value) {
  if (typeof value === 'string' && isExternalUrl(value)) {
    return urlToPath(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const key = k.toLowerCase();
      if ((key === 'link_m3u8' || key === 'link' || key === 'url' || key === 'm3u8') && typeof v === 'string') {
        continue;
      }
      out[k] = sanitizeValue(v);
    }
    return out;
  }
  return value;
}

export function sanitizeResponse(data) {
  if (data == null) return data;
  return sanitizeValue(data);
}

export default sanitizeResponse;
