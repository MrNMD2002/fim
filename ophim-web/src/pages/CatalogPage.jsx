import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import MovieCard from '../components/MovieCard';

function normalizeItems(data) {
  if (!data) return [];
  if (data.items) return data.items;
  if (data.data?.items) return data.data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

const PATH_PREFIX = {
  '/danh-sach': 'catalog',
  '/the-loai': 'category',
  '/quoc-gia': 'region',
};

const CatalogPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const pathname = location.pathname || '';
  const prefix = pathname.startsWith('/quoc-gia')
    ? '/quoc-gia'
    : pathname.startsWith('/the-loai')
      ? '/the-loai'
      : '/danh-sach';
  const type = PATH_PREFIX[prefix] || 'catalog';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState('');

  useEffect(() => {
    document.title = title ? `${title} — GocchillcuaBeu` : 'GocchillcuaBeu';
  }, [title]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPage(1);
      let data = null;
      if (type === 'catalog') {
        data = await api.getListBySlug(slug, 1);
        setTitle((data?.seoOnPage?.title || slug).replace(/-/g, ' '));
      } else if (type === 'category') {
        data = await api.getMoviesByCategory(slug, 1);
        setTitle(`Thể loại: ${(slug || '').replace(/-/g, ' ')}`);
      } else {
        try {
          data = await api.getMoviesByCountry(slug, 1);
        } catch (_) {
          data = null;
        }
        setTitle(data?.seoOnPage?.title ? `Quốc gia: ${data.seoOnPage.title}` : `Quốc gia: ${(slug || '').replace(/-/g, ' ')}`);
      }
      if (cancelled) return;
      let items = normalizeItems(data) || [];
      items = api.sortMoviesByNewest(items);
      setMovies(items);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, type]);

  useEffect(() => {
    if (!slug || page <= 1) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let data = null;
      if (type === 'catalog') data = await api.getListBySlug(slug, page);
      else if (type === 'category') data = await api.getMoviesByCategory(slug, page);
      else {
        try {
          data = await api.getMoviesByCountry(slug, page);
        } catch (_) {
          data = null;
        }
      }
      if (cancelled) return;
      let items = normalizeItems(data) || [];
      items = api.sortMoviesByNewest(items);
      setMovies((prev) => (page === 1 ? items : [...prev, ...items]));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, type, page]);

  const loadMore = () => setPage((p) => p + 1);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 capitalize">
            <span className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-pink-700 rounded-full shadow-lg shadow-pink-900/30" />
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {title || slug?.replace(/-/g, ' ')}
            </span>
          </h1>
        </header>

        {loading && movies.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-400">Đang tải phim cho Bệu...</span>
          </div>
        ) : movies.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Chưa có phim này, Bệu thử mục khác nha.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie._id || movie.slug} movie={movie} />
              ))}
            </div>
            {loading && movies.length > 0 && (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && movies.length > 0 && (
              <div className="flex justify-center py-8">
                <button
                  type="button"
                  onClick={loadMore}
                  className="px-8 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default CatalogPage;
