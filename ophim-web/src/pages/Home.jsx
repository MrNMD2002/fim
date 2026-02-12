import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import MovieCard from '../components/MovieCard';
import { getSpecialDayToday, getBannerMessage, getBannerImageUrl } from '../constants/specialDays';

function normalizeItems(data) {
  if (!data) return [];
  if (data.items) return data.items;
  if (data.data?.items) return data.data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

const DEFAULT_BANNER = '/banner.png';

function BannerSection() {
  const special = getSpecialDayToday();
  const bannerMessage = getBannerMessage();
  const bannerSrc = getBannerImageUrl();
  const [imgSrc, setImgSrc] = React.useState(bannerSrc);

  React.useEffect(() => {
    setImgSrc(getBannerImageUrl());
  }, []);

  const handleBannerError = () => {
    setImgSrc(DEFAULT_BANNER);
  };

  return (
    <section className="mb-8 -mx-4 sm:mx-0">
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl ring-2 ring-offset-2 ring-offset-[#0f0f0f] ${special ? 'ring-rose-400/30' : 'ring-pink-500/20'}`}>
        <div className="aspect-[21/9] min-h-[200px] max-h-[320px] bg-gradient-to-br from-pink-900/60 via-gray-900 to-pink-950/70">
          <img
            src={imgSrc}
            alt="Góc chill của Bệu"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[1.05] contrast-[1.02]"
            onError={handleBannerError}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <p className="text-pink-200/90 text-sm md:text-base font-medium mb-1">GocchillcuaBeu</p>
          <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">Góc chill của Bệu</h2>
          <p className="text-gray-300 text-sm md:text-base mt-2 max-w-xl">{bannerMessage}</p>
        </div>
      </div>
    </section>
  );
}

const Home = () => {
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get('search') || '';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);

  const isSearchMode = searchKeyword.trim() !== '';

  useEffect(() => {
    document.title = isSearchMode ? `Tìm kiếm: ${searchKeyword} — GocchillcuaBeu` : 'GocchillcuaBeu — Trang chủ';
  }, [isSearchMode, searchKeyword]);

  useEffect(() => {
    if (isSearchMode) {
      let cancelled = false;
      (async () => {
        setSearchLoading(true);
        const data = await api.searchMovies(searchKeyword);
        if (!cancelled) {
          setMovies(normalizeItems(data) || []);
          setSearchLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }
  }, [searchKeyword, isSearchMode]);

  useEffect(() => {
    if (!isSearchMode) {
      loadMovies();
    }
  }, [page, isSearchMode]);

  const loadMovies = async () => {
    setLoading(true);
    const data = await api.getNewMovies(page);
    const items = normalizeItems(data);
    setMovies((prev) => (page === 1 ? items : [...prev, ...(items || [])]));
    setLoading(false);
  };

  const allMovies = movies || [];
  const phimBo = allMovies.filter((m) => m.type === 'series' || (m.episode_current && String(m.episode_current).includes('/')));
  const phimLe = allMovies.filter((m) => m.type === 'single' || (m.episode_current && !String(m.episode_current).includes('/') && m.episode_current !== 'Trailer'));

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <div className="relative">
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-pink-950/20 via-transparent to-transparent pointer-events-none" aria-hidden />
        <div className="container mx-auto px-4 py-6 max-w-7xl relative">
          {!isSearchMode && (
            <BannerSection />
          )}
          {isSearchMode ? (
            <>
              <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-pink-700 rounded-full shadow-lg shadow-pink-900/30" />
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Kết quả tìm kiếm: <span className="text-pink-500">&quot;{searchKeyword}&quot;</span>
                  </span>
                </h1>
                <p className="mt-2 text-gray-500 text-sm">Tìm thấy trên Trang chủ</p>
              </header>
              {searchLoading ? (
                <div className="flex justify-center items-center py-12 gap-3">
                  <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400">Đang tải phim cho Bệu...</span>
                </div>
              ) : allMovies.length === 0 ? (
                <p className="text-center text-gray-500 py-12">Chưa có phim này, Bệu thử từ khóa khác nha.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {allMovies.map((movie) => (
                    <MovieCard key={movie._id || movie.slug} movie={movie} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-pink-700 rounded-full shadow-lg shadow-pink-900/30" />
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Mới cập nhật</span>
                </h1>
              </header>

              {allMovies.length === 0 && !loading && (
                <p className="text-center text-gray-500 py-12">Chưa có phim nào, Bệu thử lại nha.</p>
              )}

              {loading && page === 1 ? (
                <div className="flex justify-center items-center py-12 gap-3">
                  <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400">Đang tải phim cho Bệu...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {allMovies.map((movie) => (
                    <MovieCard key={movie._id || movie.slug} movie={movie} />
                  ))}
                </div>
              )}

              {!loading && allMovies.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  <Link
                    to="/danh-sach/phim-moi-cap-nhat"
                    className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold shadow-lg hover:shadow-pink-500/25 transition-all"
                  >
                    Xem thêm — Phim mới cập nhật
                  </Link>
                </div>
              )}

              {!loading && page > 1 && (
                <div className="flex justify-center py-8">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="px-8 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all"
                  >
                    Xem thêm
                  </button>
                </div>
              )}

              {(phimBo.length > 0 || phimLe.length > 0) && !loading && page === 1 && (
                <div className="mt-12 grid md:grid-cols-2 gap-8">
                  {phimBo.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <span className="w-1 h-6 bg-pink-500 rounded-full" />
                          Phim bộ
                        </h2>
                        <Link to="/danh-sach/phim-bo" className="text-pink-400 hover:text-pink-300 text-sm font-medium">
                          Xem thêm →
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {phimBo.slice(0, 8).map((movie) => (
                          <MovieCard key={movie._id || movie.slug} movie={movie} />
                        ))}
                      </div>
                    </section>
                  )}
                  {phimLe.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <span className="w-1 h-6 bg-pink-500 rounded-full" />
                          Phim lẻ
                        </h2>
                        <Link to="/danh-sach/phim-le" className="text-pink-400 hover:text-pink-300 text-sm font-medium">
                          Xem thêm →
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {phimLe.slice(0, 8).map((movie) => (
                          <MovieCard key={movie._id || movie.slug} movie={movie} />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Home;
