import axios from 'axios';
import config from '../config.js';
import streamTokenStore from './StreamTokenStore.js';

/**
 * Service proxy stream HLS/m3u8.
 * Client chỉ gửi token (?t=), không gửi URL nguồn → DevTools không lộ API.
 */
class StreamProxyService {
  constructor(options = {}) {
    const { headers } = config.externalApi;
    this.headers = options.headers ?? headers;
    const base = config.publicBaseUrl !== '' ? config.publicBaseUrl : '';
    this.streamBaseUrl = options.streamBaseUrl ?? `${base}${config.apiPrefix}/stream`;
  }

  /**
   * Kiểm tra URL có được phép proxy (whitelist domain) - bảo mật.
   * Set env ALLOWED_STREAM_DOMAINS=domain1.com,domain2.com để giới hạn; để trống = cho phép tất cả.
   */
  isAllowedUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const allowed = process.env.ALLOWED_STREAM_DOMAINS;
    if (!allowed) return true; // Không cấu hình = cho phép (có thể siết lại khi deploy)
    try {
      const host = new URL(url).hostname.toLowerCase();
      return allowed.split(',').some((d) => host.endsWith(d.trim()));
    } catch {
      return false;
    }
  }

  /**
   * Proxy: ưu tiên ?t=TOKEN (không lộ URL). Hỗ trợ ?url= chỉ nội bộ (rewrite m3u8).
   */
  async proxy(req, res) {
    const token = req.query?.t;
    const urlParam = req.query?.url;
    let targetUrl = null;
    if (token) {
      targetUrl = streamTokenStore.get(token);
      if (!targetUrl) {
        res.status(404).send('Invalid or expired token');
        return;
      }
    } else if (urlParam) {
      targetUrl = decodeURIComponent(urlParam);
      if (!this.isAllowedUrl(targetUrl)) {
        res.status(403).send('URL not allowed');
        return;
      }
    } else {
      res.status(400).send('Missing t or url');
      return;
    }

    const decodedUrl = targetUrl;

    try {
      const response = await axios({
        method: 'get',
        url: decodedUrl,
        responseType: 'stream',
        headers: this.headers,
        timeout: 30000,
      });

      const contentType = response.headers['content-type'] || '';
      const isM3u8 =
        contentType.includes('application/x-mpegurl') ||
        contentType.includes('application/vnd.apple.mpegurl') ||
        decodedUrl.endsWith('.m3u8');

      if (isM3u8) {
        await this._rewriteM3u8(response.data, decodedUrl, res);
      } else {
        res.setHeader('Content-Type', contentType || 'video/mp2t');
        response.data.pipe(res);
      }
    } catch (error) {
      console.error('StreamProxyService error:', error.message);
      res.status(500).send('Error fetching stream');
    }
  }

  /**
   * Đọc m3u8, rewrite mọi URL segment qua token (client chỉ thấy ?t=, không thấy URL nguồn).
   */
  _rewriteM3u8(stream, originalUrl, res) {
    return new Promise((resolve, reject) => {
      let data = '';
      stream.setEncoding('utf8');
      stream.on('data', (chunk) => (data += chunk));
      stream.on('end', () => {
        try {
          const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);
          const lines = data.split('\n');
          const rewritten = lines
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith('#')) return line;
              const absoluteUrl = trimmed.startsWith('http')
                ? trimmed
                : baseUrl + trimmed;
              const segToken = streamTokenStore.registerSegment(absoluteUrl);
              return `${this.streamBaseUrl}?t=${segToken}`;
            })
            .join('\n');
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.send(rewritten);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      stream.on('error', reject);
    });
  }
}

const streamProxyService = new StreamProxyService();

export { StreamProxyService, streamProxyService };
export default streamProxyService;
