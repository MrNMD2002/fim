import axios from 'axios';
import config from '../config.js';

/** Chuẩn hóa response chi tiết phim từ nhiều format API (episodes/movie luôn có ở top level) */
function normalizeMovieDetailResponse(data) {
  const inner = data.data ?? data;
  const item = inner?.item ?? data.item;
  return {
    ...data,
    movie: data.movie ?? inner?.movie ?? item?.movie ?? item,
    episodes:
      data.episodes ??
      inner?.episodes ??
      item?.episodes ??
      (Array.isArray(inner) ? inner : []),
  };
}

/**
 * Client OOP gọi API nguồn (OPhim).
 * Tất cả URL và headers nằm trong backend, không lộ ra frontend.
 */
class OPhimClient {
  constructor(options = {}) {
    const { baseUrl, headers } = config.externalApi;
    this.baseUrl = options.baseUrl ?? baseUrl;
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: options.headers ?? headers,
      timeout: Number(options.timeout) || 15000,
    });
  }

  /** Danh sách phim mới cập nhật */
  async getNewMovies(page = 1) {
    const { data } = await this.http.get('/danh-sach/phim-moi-cap-nhat', {
      params: { page },
    });
    return data;
  }

  /** Danh sách theo slug: phim-moi-cap-nhat | phim-bo | phim-le */
  async getListBySlug(slug, page = 1) {
    const { data } = await this.http.get(`/danh-sach/${slug}`, { params: { page } });
    return data;
  }

  /**
   * Chi tiết phim theo slug. Hỗ trợ ?ep= cho tập.
   */
  async getMovieDetail(slug, ep) {
    const params = ep != null && String(ep).trim() !== '' ? { ep: Number(ep) || ep } : {};
    const endpoints = [`/phim/${slug}`, `/v1/api/phim/${slug}`, `/api/v2/phim/${slug}`];
    let lastValidResponse = null;
    for (const path of endpoints) {
      try {
        const { data } = await this.http.get(path, { params });
        if (!data) continue;
        const hasContent = data.movie || data.episodes || data.data;
        if (!hasContent) continue;
        const normalized = normalizeMovieDetailResponse(data);
        const episodes = normalized.episodes ?? [];
        const hasEpisodes =
          (Array.isArray(episodes) && episodes.length > 0) ||
          (typeof episodes === 'object' && Object.keys(episodes || {}).length > 0);
        if (hasEpisodes) return normalized;
        lastValidResponse = normalized;
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 500) continue;
        throw err;
      }
    }
    return lastValidResponse;
  }

  /** Danh sách quốc gia (slug + name) từ OPhim. */
  async getCountries() {
    const { data } = await this.http.get('/v1/api/quoc-gia');
    return data;
  }

  /** Phim theo quốc gia. Ưu tiên /v1/api/quoc-gia/{slug}, fallback: getNewMovies + lọc theo country. */
  async getMoviesByCountry(slug, page = 1) {
    const endpoints = [
      `/v1/api/quoc-gia/${slug}`,
      `/api/v2/quoc-gia/${slug}`,
      `/danh-sach/phim-${slug}`,
    ];
    for (const path of endpoints) {
      try {
        const { data } = await this.http.get(path, { params: { page } });
        const rawItems = data?.data?.items ?? data?.items ?? (Array.isArray(data?.data) ? data.data : []);
        const items = Array.isArray(rawItems) ? rawItems : [];
        const pagination = data?.data?.pagination ?? data?.pagination ?? { currentPage: Number(page) || 1, totalPages: items.length > 0 ? Math.max(1, Math.ceil((data?.data?.totalItems ?? data?.totalItems ?? items.length) / 24)) : 1 };
        const title = data?.data?.seoOnPage?.title ?? data?.seoOnPage?.title ?? `Phim ${String(slug).replace(/-/g, ' ')}`;
        return { items, pagination, seoOnPage: { title } };
      } catch (_) {}
    }
    const perPage = 24;
    const slugNorm = String(slug).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const toSlug = (s) => (s && String(s).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) || '';
    const all = [];
    const seen = new Set();
    for (let p = 1; p <= Math.max(6, Number(page) + 2); p++) {
      const res = await this.getNewMovies(p);
      const list = res?.items ?? res?.data?.items ?? [];
      for (const m of list) {
        const countries = m.country ?? m.region ?? [];
        const match = Array.isArray(countries) && countries.some((c) => {
          const cSlug = (c?.slug && toSlug(c.slug)) || toSlug(c?.name);
          return cSlug === slugNorm || (cSlug && slugNorm && (cSlug.includes(slugNorm) || slugNorm.includes(cSlug)));
        });
        if (match && !seen.has(m.slug || m._id)) {
          seen.add(m.slug || m._id);
          all.push(m);
        }
      }
    }
    const start = (Number(page) - 1) * perPage;
    return {
      items: all.slice(start, start + perPage),
      pagination: { currentPage: Number(page) || 1, totalPages: Math.max(1, Math.ceil(all.length / perPage)) },
      seoOnPage: { title: `Phim ${String(slug).replace(/-/g, ' ')}` },
    };
  }

  /** Tìm kiếm phim */
  async searchMovies(keyword) {
    const { data } = await this.http.get('/v1/api/tim-kiem', {
      params: { keyword },
    });
    return data;
  }

  /** Danh sách thể loại */
  async getCategories() {
    const { data } = await this.http.get('/v1/api/the-loai');
    return data;
  }

  /** Phim theo thể loại */
  async getMoviesByCategory(slug, page = 1) {
    const { data } = await this.http.get(`/v1/api/the-loai/${slug}`, {
      params: { page },
    });
    return data;
  }
}

// Singleton để dùng chung trong app
const ophimClient = new OPhimClient();

export { OPhimClient, ophimClient };
export default ophimClient;
