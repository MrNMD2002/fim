/**
 * Cấu hình backend - đọc từ biến môi trường, không lộ API gốc ra ngoài.
 */
const config = {
  port: Number(process.env.PORT) || 5000,

  /** Base URL API nguồn - chỉ dùng trong server, không expose ra frontend */
  externalApi: {
    baseUrl: process.env.OPHIM_BASE_URL || 'https://ophim1.com',
    /** Base URL cho stream (m3u8) khi link trả về là path tương đối; để trống = dùng baseUrl */
    streamBaseUrl: process.env.STREAM_BASE_URL || null,
    headers: {
      'User-Agent':
        process.env.OPHIM_USER_AGENT ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Referer: process.env.OPHIM_REFERER || 'https://ophim1.com/',
    },
  },

  /** URL gốc của backend (để rewrite stream proxy) - dùng trong server */
  get serverBaseUrl() {
    const host = process.env.SERVER_HOST || 'localhost';
    const port = this.port;
    const protocol = process.env.SERVER_PROTOCOL || 'http';
    if ((port === 80 && protocol === 'http') || (port === 443 && protocol === 'https')) {
      return `${protocol}://${host}`;
    }
    return `${protocol}://${host}:${port}`;
  },

  /** Prefix API public cho client (vd: /api) */
  apiPrefix: process.env.API_PREFIX || '/api',

  /** Base URL dùng trong m3u8 rewrite: '' = relative (/api/stream), set = full URL */
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? '',

  /** Base URL ảnh (proxy qua /api/image) - chỉ dùng server */
  imageBaseUrl: process.env.IMAGE_BASE_URL || 'https://img.ophim.live',

  /** Access keys - nếu set thì client phải gửi key hợp lệ để dùng API */
  accessKeys: process.env.ACCESS_KEY
    ? [process.env.ACCESS_KEY.trim()]
    : (process.env.ACCESS_KEYS ? process.env.ACCESS_KEYS.split(',').map((s) => s.trim()).filter(Boolean) : []),
  requireAccessKey: false, // set ở dưới
  sessionSecret: process.env.SESSION_SECRET || 'ryan-movie-session-secret-change-in-production',
  sessionMaxAgeDays: Number(process.env.SESSION_MAX_AGE_DAYS) || 7,
};

config.requireAccessKey = config.accessKeys.length > 0;

export default config;
