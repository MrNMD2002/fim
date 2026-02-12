import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import config from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import ophimClient from './services/OPhimClient.js';

const app = express();
const PORT = config.port;
const prefix = config.apiPrefix;

// Proxy ảnh: tránh CORS và path sai → banner/thumb/poster hiển thị đúng
app.get(`${prefix}/image`, async (req, res) => {
  try {
    let path = req.query?.path?.trim();
    if (!path) {
      res.status(400).send('Missing path');
      return;
    }
    path = path.replace(/^\//, '');
    const base = config.imageBaseUrl.replace(/\/$/, '');
    const url = path.startsWith('http') ? path : (path.startsWith('uploads/') ? `${base}/${path}` : `${base}/uploads/movies/${path}`);
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
      headers: config.externalApi.headers,
      timeout: 15000,
      validateStatus: (s) => s === 200,
    });
    if (!response) {
      res.status(404).send('Not found');
      return;
    }
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (e) {
    const status = e.response?.status;
    if (status === 404) res.status(404).send('Not found');
    else {
      console.error('Image proxy error:', e.message);
      res.status(500).send('Error loading image');
    }
  }
});

const streamHeaders = {
  'User-Agent': config.externalApi?.headers?.['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: (config.externalApi?.headers?.Referer || config.externalApi?.baseUrl || 'https://ophim1.com') + '/',
};

/** Thử nhiều base URL cho stream (path tương đối) — OPhim có thể dùng domain khác cho CDN. */
function getStreamBases() {
  const list = [];
  if (config.externalApi?.streamBaseUrl) list.push(config.externalApi.streamBaseUrl.replace(/\/$/, ''));
  const main = (config.externalApi?.baseUrl || 'https://ophim1.com').replace(/\/$/, '');
  if (!list.includes(main)) list.push(main);
  const extras = ['https://ophim1.com', 'https://www.ophim1.com', 'https://ophim.live', 'https://hd.ophim.live'];
  extras.forEach((u) => {
    const b = u.replace(/\/$/, '');
    if (!list.includes(b)) list.push(b);
  });
  return list;
}

/** Rewrite m3u8: segment URL tương đối → proxy (path= hoặc url=). baseUrlOrPath: path "a/b/c.m3u8" hoặc full URL gốc. */
function rewriteM3u8Lines(text, baseUrlOrPath, streamPrefix) {
  const isFullUrl = typeof baseUrlOrPath === 'string' && (baseUrlOrPath.startsWith('http://') || baseUrlOrPath.startsWith('https://'));
  let baseDir = '';
  let baseOrigin = '';
  if (isFullUrl) {
    try {
      const u = new URL(baseUrlOrPath);
      baseOrigin = u.origin;
      const pathPart = u.pathname.replace(/^\//, '');
      baseDir = pathPart.includes('/') ? pathPart.replace(/\/[^/]*$/, '') + '/' : '';
    } catch (_) {}
  } else {
    baseDir = (baseUrlOrPath || '').includes('/') ? (baseUrlOrPath || '').replace(/\/[^/]*$/, '') + '/' : '';
  }
  const lines = text.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      out.push(line);
      continue;
    }
    const seg = trimmed.split('?')[0];
    if (!/\.(ts|m3u8|key)(\?|$)/i.test(seg)) {
      out.push(line);
      continue;
    }
    if (trimmed.startsWith('http')) {
      out.push(streamPrefix + 'url=' + encodeURIComponent(trimmed));
    } else if (isFullUrl && baseOrigin) {
      const rel = (baseDir + trimmed).replace(/\/+/g, '/').replace(/^\//, '');
      const fullSeg = (baseOrigin + '/' + rel).replace(/([^:])\/\/+/g, '$1/');
      out.push(streamPrefix + 'url=' + encodeURIComponent(fullSeg));
    } else {
      const segPath = (baseDir + trimmed).replace(/\/+/g, '/').replace(/^\//, '');
      out.push(streamPrefix + 'path=' + encodeURIComponent(segPath));
    }
  }
  return out.join('\n');
}

// Proxy stream (m3u8 / video URL) — tránh CORS. Hỗ trợ url= (full URL) hoặc path= (relative). M3u8 được rewrite segment qua proxy.
app.get(`${prefix}/stream`, async (req, res) => {
  try {
    const rawUrl = req.query?.url?.trim();
    const rawPath = req.query?.path?.trim();
    let url = null;
    let currentPath = null;
    if (rawUrl) {
      url = decodeURIComponent(rawUrl);
      if (url.startsWith('//')) url = 'https:' + url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        res.status(400).send('Invalid url');
        return;
      }
    } else if (rawPath) {
      currentPath = decodeURIComponent(rawPath).replace(/^\//, '');
      const bases = getStreamBases();
      let lastErr = null;
      for (const base of bases) {
        const tryUrl = `${base}/${currentPath}`;
        try {
          const probe = await axios({
            method: 'get',
            url: tryUrl,
            timeout: 8000,
            validateStatus: (s) => s === 200,
            headers: streamHeaders,
            maxRedirects: 5,
          });
          if (probe.status === 200) {
            url = tryUrl;
            break;
          }
        } catch (err) {
          lastErr = err;
          continue;
        }
      }
      if (!url) {
        if (lastErr?.response?.status) throw lastErr;
        throw new Error(`Stream not found at any base. Last: ${lastErr?.message || 'unknown'}`);
      }
    }
    if (!url) {
      res.status(400).send('Missing url or path');
      return;
    }

    const isM3u8 = /\.m3u8(\?|$)/i.test(url) || (currentPath && /\.m3u8(\?|$)/i.test(currentPath));
    const streamPrefix = `${prefix.startsWith('/') ? '' : '/'}${prefix}/stream?`;

    if (isM3u8) {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'text',
        timeout: 30000,
        validateStatus: (s) => s === 200,
        headers: streamHeaders,
        maxRedirects: 5,
      });
      const pathForRewrite = currentPath || url.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
      const baseForRewrite = currentPath ? pathForRewrite : url;
      const rewritten = rewriteM3u8Lines(response.data, baseForRewrite, streamPrefix);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.send(rewritten);
    } else {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
        timeout: 60000,
        validateStatus: (s) => s === 200,
        headers: streamHeaders,
        maxRedirects: 5,
      });
      res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=300');
      response.data.pipe(res);
    }
  } catch (e) {
    const status = e.response?.status;
    if (status) res.status(status).send('Stream error');
    else {
      console.error('Stream proxy error:', e.message);
      res.status(500).send('Error loading stream');
    }
  }
});

// --- Routes: trả response API nguồn nguyên bản (không sanitize) ---

app.get(`${prefix}/movies`, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await ophimClient.getNewMovies(page);
    res.json(data);
  } catch (error) {
    console.error('Error fetching movies:', error.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get(`${prefix}/detail/:slug`, async (req, res) => {
  try {
    const { slug } = req.params;
    const ep = req.query.ep != null ? req.query.ep : undefined;
    const data = await ophimClient.getMovieDetail(slug, ep);
    res.json(data);
  } catch (error) {
    console.error('Error fetching detail:', error.message);
    res.status(500).json({ error: 'Failed to fetch movie detail' });
  }
});

app.get(`${prefix}/danh-sach/:slug`, async (req, res) => {
  try {
    const { slug } = req.params;
    const page = req.query.page || 1;
    const data = await ophimClient.getListBySlug(slug, page);
    res.json(data);
  } catch (error) {
    console.error('Error fetching list:', error.message);
    res.status(500).json({ error: 'Failed to fetch list' });
  }
});

app.get(`${prefix}/countries`, async (req, res) => {
  try {
    const data = await ophimClient.getCountries();
    res.json(data);
  } catch (error) {
    console.error('Error fetching countries:', error.message);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

app.get(`${prefix}/country/:slug`, async (req, res) => {
  try {
    const { slug } = req.params;
    const page = req.query.page || 1;
    const data = await ophimClient.getMoviesByCountry(slug, page);
    res.json(data);
  } catch (error) {
    console.error('Error fetching movies by country:', error.message);
    res.status(500).json({ error: 'Failed to fetch movies by country' });
  }
});

app.get(`${prefix}/search`, async (req, res) => {
  try {
    const { keyword } = req.query;
    const data = await ophimClient.searchMovies(keyword);
    res.json(data);
  } catch (error) {
    console.error('Error searching:', error.message);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

app.get(`${prefix}/categories`, async (req, res) => {
  try {
    const data = await ophimClient.getCategories();
    res.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get(`${prefix}/categories/:slug`, async (req, res) => {
  try {
    const { slug } = req.params;
    const page = req.query.page || 1;
    const data = await ophimClient.getMoviesByCategory(slug, page);
    res.json(data);
  } catch (error) {
    console.error('Error fetching category:', error.message);
    res.status(500).json({ error: 'Failed to fetch category movies' });
  }
});

// Production: phục vụ frontend đã build (Docker / npm run build)
const distPath = path.join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith(prefix)) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
