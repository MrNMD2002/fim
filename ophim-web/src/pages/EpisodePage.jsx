import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import VideoPlayer from '../components/VideoPlayer';

const EpisodePage = () => {
  const { movieSlug, episodeId } = useParams();
  const [detail, setDetail] = useState(null);
  const [episodeDetail, setEpisodeDetail] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movieSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const mainDetail = await api.getMovieDetail(movieSlug);
      if (cancelled) return;
      setDetail(mainDetail);
      const epNum = episodeId ? String(episodeId).replace(/^tap-/, '') : '1';
      let link = null;
      if (epNum !== '1') {
        const detailWithEp = await api.getMovieDetail(movieSlug, epNum);
        if (cancelled) return;
        setEpisodeDetail(detailWithEp);
        const firstFromEp = api.getFirstStreamFromDetail(detailWithEp);
        if (firstFromEp.link) link = firstFromEp.link;
      }
      if (link == null && mainDetail) {
        link = api.getNthStreamFromDetail(mainDetail, Number(epNum) || 1);
      }
      if (cancelled) return;
      if (link) {
        const url = api.getStreamUrl(link);
        setStreamUrl(url || link);
      } else {
        setError('Không tải được link phát.');
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [movieSlug, episodeId]);

  const movie = detail?.movie ?? detail?.data?.movie ?? episodeDetail?.movie ?? {};
  const episodes = api.getEpisodesFromDetail(detail || episodeDetail);
  const currentIndex = episodeId ? String(episodeId).replace(/^tap-/, '') : '1';
  const totalEpisodes = episodes.length;
  const currentLabel = episodes.find((e) => e.id === currentIndex || e.slug === currentIndex)?.name || `Tập ${currentIndex}`;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-pink-400 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to={`/phim/${movieSlug}`} className="hover:text-pink-400 transition-colors truncate max-w-[180px]">
            {movie.name || 'Phim'}
          </Link>
          <span>/</span>
          <span className="text-pink-400">Đang xem: {currentLabel}</span>
          {totalEpisodes > 0 && <span className="text-gray-500">/ {totalEpisodes} tập</span>}
        </nav>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Đang tải phim cho Bệu...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-gray-800/80 border border-gray-700 p-8 text-center">
            <p className="text-gray-400">Để tớ sửa giúp Bệu, thử tải lại nha.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium"
            >
              Tải lại
            </button>
          </div>
        ) : streamUrl ? (
          <div className="rounded-2xl overflow-hidden bg-black shadow-2xl">
            <VideoPlayer src={streamUrl} />
          </div>
        ) : null}

        {!loading && detail && episodes.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-white mb-3">
              Chọn tập (đang xem {currentLabel})
            </h2>
            <div className="flex flex-wrap gap-2">
              {episodes.map((ep) => {
                const isActive = ep.id === currentIndex || ep.slug === currentIndex;
                return (
                  <Link
                    key={ep.id}
                    to={`/phim/${movieSlug}/tap/${ep.id}`}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-pink-600 text-white border border-pink-500'
                        : 'bg-gray-700/80 hover:bg-pink-600/50 text-white border border-gray-600'
                    }`}
                  >
                    {ep.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default EpisodePage;
