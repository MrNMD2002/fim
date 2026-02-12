import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"%3E%3Crect fill="%23374151" width="100" height="150"/%3E%3C/svg%3E';

const SinglePage = () => {
  const { movieSlug } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await api.getMovieDetail(movieSlug);
      if (!cancelled) {
        setDetail(data);
        const movie = data?.movie ?? data?.data?.movie ?? data?.data?.item;
        if (movie?.name) document.title = `${movie.name} — GocchillcuaBeu`;
        else document.title = 'GocchillcuaBeu';
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [movieSlug]);

  if (loading && !detail) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-400">Đang tải phim cho Bệu...</span>
        </div>
        <Footer />
      </div>
    );
  }

  const movie = detail?.movie ?? detail?.data?.movie ?? detail?.data?.item ?? {};
  const episodes = api.getEpisodesFromDetail(detail);
  const firstEp = episodes[0];
  const thumb = api.getImageUrl(movie.thumb_url || movie.poster_url || '') || PLACEHOLDER_IMG;

  if (!detail || !movie?.slug) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Chưa có phim này, Bệu thử lại nha.</p>
          <Link to="/" className="mt-4 inline-block text-pink-400 hover:text-pink-300">← Về Trang chủ</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0 w-full lg:w-80">
            <div className="rounded-2xl overflow-hidden border border-gray-600/60 shadow-2xl ring-1 ring-white/10 bg-gray-800/50">
              <img
                src={thumb}
                alt={movie.name}
                className="w-full aspect-[2/3] object-cover object-center"
                decoding="async"
                onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
              />
            </div>
            {movie.quality && (
              <span className="inline-block mt-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-md uppercase">
                {movie.quality}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{movie.name}</h1>
            {movie.origin_name && <p className="text-gray-400 text-lg mb-2">{movie.origin_name}</p>}
            {movie.year && <p className="text-pink-400/90 text-sm font-medium mb-3">Năm: {movie.year}</p>}
            {movie.time && <p className="text-gray-500 text-sm mb-3">Thời lượng: {movie.time}</p>}
            {movie.category?.length > 0 && (
              <p className="text-gray-400 text-sm mb-3">
                Thể loại: {movie.category.map((c) => c.name).join(', ')}
              </p>
            )}
            {movie.country?.length > 0 && (
              <p className="text-gray-400 text-sm mb-4">Quốc gia: {movie.country.map((c) => c.name).join(', ')}</p>
            )}
            {movie.content && (
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: movie.content }} />
            )}

            {firstEp && (
              <Link
                to={`/phim/${movieSlug}/tap/${firstEp.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold shadow-lg hover:shadow-pink-500/25 transition-all"
              >
                Xem phim
              </Link>
            )}

            {episodes.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-pink-500 rounded-full" />
                  Chọn tập ({episodes.length} tập)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {episodes.map((ep) => (
                    <Link
                      key={ep.id}
                      to={`/phim/${movieSlug}/tap/${ep.id}`}
                      className="px-4 py-2 rounded-lg bg-gray-700/80 hover:bg-pink-600/80 text-white text-sm font-medium transition-colors border border-gray-600 hover:border-pink-500/50"
                    >
                      {ep.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default SinglePage;
