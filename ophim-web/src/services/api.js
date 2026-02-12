import axios from 'axios';

/**
 * Client chỉ gọi backend của mình (relative /api hoặc VITE_API_BASE).
 * Không có URL API nguồn (OPhim) ở frontend.
 */
const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const api = {
  getNewMovies: async (page = 1) => {
    try {
      const { data } = await http.get('/movies', { params: { page } });
      return data;
    } catch (error) {
      console.error('Error fetching new movies:', error);
      return null;
    }
  },

  getListBySlug: async (slug, page = 1) => {
    try {
      const { data } = await http.get(`/danh-sach/${slug}`, { params: { page } });
      return data;
    } catch (error) {
      console.error('Error fetching list:', error);
      return null;
    }
  },

  getMovieDetail: async (slug, ep) => {
    try {
      const params = ep != null && String(ep).trim() !== '' ? { ep: Number(ep) || ep } : {};
      const { data } = await http.get(`/detail/${slug}`, { params });
      return data;
    } catch (error) {
      console.error('Error fetching detail:', error);
      return null;
    }
  },

  getCountries: async () => {
    try {
      const { data } = await http.get('/countries');
      return data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      return null;
    }
  },

  getMoviesByCountry: async (slug, page = 1) => {
    try {
      const { data } = await http.get(`/country/${slug}`, { params: { page } });
      return data;
    } catch (error) {
      console.error('Error fetching movies by country:', error);
      return null;
    }
  },

  searchMovies: async (keyword) => {
    try {
      const { data } = await http.get('/search', { params: { keyword } });
      return data;
    } catch (error) {
      console.error('Error searching:', error);
      return null;
    }
  },

  getCategories: async () => {
    try {
      const { data } = await http.get('/categories');
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return null;
    }
  },

  getMoviesByCategory: async (slug, page = 1) => {
    try {
      const { data } = await http.get(`/categories/${slug}`, { params: { page } });
      return data;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  },

  /** URL ảnh qua proxy backend → banner/thumb/poster load được (tránh CORS, path sai). */
  getImageUrl: (path) => {
    if (!path || typeof path !== 'string') return '';
    let p = path.trim();
    if (p.startsWith('http://') || p.startsWith('https://')) {
      try {
        p = new URL(p).pathname.replace(/^\//, '');
      } catch {
        return '';
      }
    } else {
      p = p.replace(/^\//, '');
    }
    return p ? `${BASE_URL}/image?path=${encodeURIComponent(p)}` : '';
  },

  /** Chuyển link phát (m3u8) qua proxy backend; link embed giữ nguyên. Link tương đối → proxy ?path= để backend resolve. */
  getStreamUrl: (link) => {
    if (!link || typeof link !== 'string') return '';
    let trimmed = link.trim();
    if (!trimmed) return '';
    if (trimmed.includes('embed') || trimmed.includes('iframe')) return trimmed;
    if (trimmed.startsWith('//')) trimmed = 'https:' + trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return `${BASE_URL}/stream?url=${encodeURIComponent(trimmed)}`;
    }
    const path = trimmed.replace(/^\//, '');
    return path ? `${BASE_URL}/stream?path=${encodeURIComponent(path)}` : '';
  },

  /**
   * Lấy link phát đầu tiên và thông tin phim từ response chi tiết (detail từ getMovieDetail).
   * Trả { link, movie } — link là URL m3u8/stream, dùng trực tiếp cho player.
   */
  getFirstStreamFromDetail: (detail) => {
    if (!detail) return { link: null, movie: null };
    const movie = detail.movie ?? detail.data?.movie ?? detail.data?.item ?? detail;

    const pickLink = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      return obj.link_m3u8 ?? obj.link ?? obj.url ?? obj.m3u8 ?? obj.link_embed ?? null;
    };

    let episodes = detail.episodes ?? detail.data?.episodes ?? detail.movie?.episodes ?? detail.data?.item?.episodes ?? [];
    if (!Array.isArray(episodes)) {
      if (episodes && typeof episodes === 'object') {
        const firstKey = Object.keys(episodes)[0];
        episodes = firstKey ? (episodes[firstKey] ?? []) : [];
      } else {
        episodes = [];
      }
    }

    for (const server of episodes) {
      let list = server?.server_data ?? server?.serverData ?? server?.data ?? server?.episodes ?? server?.items;
      if (Array.isArray(server)) list = server;
      if (typeof list === 'string' && list.startsWith('http')) return { link: list.trim(), movie };
      const arr = Array.isArray(list) ? list : [];
      for (const ep of arr) {
        const link = typeof ep === 'string' ? ep : pickLink(ep);
        if (link && typeof link === 'string' && link.trim()) return { link: link.trim(), movie };
      }
    }

    if (detail.movie?.episode_current) {
      const link = pickLink(detail.movie);
      if (link) return { link: link.trim(), movie };
    }

    return { link: null, movie };
  },

  /** Lấy link phát tập thứ n (1-based). Hỗ trợ episodes array/object, server_data. */
  getNthStreamFromDetail: (detail, n) => {
    if (!detail || !n || n < 1) return null;
    const pickLink = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      return obj.link_m3u8 ?? obj.link ?? obj.url ?? obj.m3u8 ?? obj.link_embed ?? null;
    };
    const raw = detail.episodes ?? detail.data?.episodes ?? detail.movie?.episodes ?? detail.data?.item?.episodes ?? [];
    const links = [];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const keys = Object.keys(raw).filter((k) => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);
      if (keys.length > 0) {
        keys.forEach((key) => {
          const ep = raw[String(key)];
          const link = ep && typeof ep === 'object' ? pickLink(ep) : null;
          if (link && typeof link === 'string' && link.trim()) links.push(link.trim());
        });
        return links[Number(n) - 1] || null;
      }
      const numFromKey = (k) => { const m = String(k).match(/(\d+)/); return m ? parseInt(m[1], 10) : 0; };
      const sortedKeys = Object.keys(raw).sort((a, b) => numFromKey(a) - numFromKey(b));
      for (const key of sortedKeys) {
        const val = raw[key];
        if (!val || typeof val !== 'object') continue;
        const list = val.server_data ?? val.serverData ?? val.data ?? val.episodes ?? (Array.isArray(val) ? val : null);
        if (Array.isArray(list)) list.forEach((ep) => { const link = typeof ep === 'string' ? ep : pickLink(ep); if (link && typeof link === 'string' && link.trim()) links.push(link.trim()); });
        else if (list && typeof list === 'object' && !Array.isArray(list)) {
          const numKeys = Object.keys(list).filter((k) => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);
          numKeys.forEach((k) => { const ep = list[String(k)]; const link = ep && typeof ep === 'object' ? pickLink(ep) : null; if (link && typeof link === 'string' && link.trim()) links.push(link.trim()); });
        } else { const link = pickLink(val); if (link && typeof link === 'string' && link.trim()) links.push(link.trim()); }
      }
      return links[Number(n) - 1] || null;
    }
    const arr = Array.isArray(raw) ? raw : [];
    for (const server of arr) {
      let list = server?.server_data ?? server?.serverData ?? server?.data ?? server?.episodes ?? server?.items;
      if (Array.isArray(server)) list = server;
      const items = Array.isArray(list) ? list : list && typeof list === 'object' ? Object.keys(list).filter((k) => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b).map((k) => list[String(k)]).filter(Boolean) : [];
      items.forEach((ep) => { const link = typeof ep === 'string' ? ep : pickLink(ep); if (link && typeof link === 'string' && link.trim()) links.push(link.trim()); });
    }
    return links[Number(n) - 1] || null;
  },

  /** Trích danh sách tập từ detail: [{ id, name, slug, link }]. */
  getEpisodesFromDetail: (detail) => {
    if (!detail) return [];
    const raw = detail.episodes ?? detail.data?.episodes ?? detail.movie?.episodes ?? detail.data?.item?.episodes ?? [];
    const list = [];
    let id = 0;
    const addEp = (ep) => {
      if (!ep) return;
      id += 1;
      const link = ep.link_m3u8 ?? ep.link ?? ep.url ?? ep.m3u8 ?? ep.link_embed ?? (typeof ep === 'string' && ep.startsWith('http') ? ep : null);
      list.push({ id: String(id), name: ep?.name ?? ep?.title ?? `Tập ${id}`, slug: ep?.slug ?? String(id), link: link && typeof link === 'string' ? link.trim() : null });
    };
    const addItems = (items) => {
      if (Array.isArray(items)) items.forEach(addEp);
      else if (items && typeof items === 'object') {
        const numFromKey = (k) => { const m = String(k).match(/(\d+)/); return m ? parseInt(m[1], 10) : 0; };
        Object.keys(items).sort((a, b) => numFromKey(a) - numFromKey(b)).forEach((k) => addEp(items[k]));
      }
    };
    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        const items = item?.server_data ?? item?.serverData ?? item?.data ?? item?.episodes ?? (Array.isArray(item) ? item : null);
        if (items) addItems(items);
        else if (item && (item.link_m3u8 || item.link || item.name || item.slug)) addEp(item);
      });
    } else if (raw && typeof raw === 'object') {
      Object.values(raw).forEach((value) => {
        const items = value?.server_data ?? value?.serverData ?? value?.data ?? value?.episodes ?? (Array.isArray(value) ? value : null);
        if (items) addItems(items);
        else if (value && (value.link_m3u8 || value.link || value.name || value.slug)) addEp(value);
      });
    }
    if (list.length === 0) {
      const { link } = this.getFirstStreamFromDetail(detail);
      if (link) list.push({ id: '1', name: 'Xem phim', slug: '1', link });
    }
    return list;
  },

  /** Sắp xếp danh sách phim: mới nhất trước. */
  sortMoviesByNewest: (items) => {
    if (!Array.isArray(items) || items.length === 0) return items;
    const getTs = (m) => m?.modified?.time ?? (m?.updatedAt ? new Date(m.updatedAt).getTime() : 0) ?? (m?.year ? new Date(String(m.year), 0).getTime() : 0);
    return [...items].sort((a, b) => getTs(b) - getTs(a));
  },
};
