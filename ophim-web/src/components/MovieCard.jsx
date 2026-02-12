import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { api } from '../services/api';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"%3E%3Crect fill="%23374151" width="100" height="150"/%3E%3C/svg%3E';

const NEW_DAYS = 14; // Phim cập nhật trong N ngày gần đây → hiện tag "Mới"
function isNewMovie(m) {
  const ts = m?.modified?.time ?? (m?.updatedAt ? new Date(m.updatedAt).getTime() : 0);
  if (!ts) return false;
  return Date.now() - ts <= NEW_DAYS * 24 * 60 * 60 * 1000;
}

const MovieCard = ({ movie }) => {
  const slug = movie?.slug ?? movie?.id ?? '';
  const [imgSrc, setImgSrc] = React.useState(() => api.getImageUrl(movie.thumb_url || movie.poster_url || '') || PLACEHOLDER_IMG);

  React.useEffect(() => {
    const url = api.getImageUrl(movie.thumb_url || movie.poster_url || '');
    setImgSrc(url || PLACEHOLDER_IMG);
  }, [movie.thumb_url, movie.poster_url]);

  const handleImgError = () => setImgSrc(PLACEHOLDER_IMG);

  const content = (
    <>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-800/80 ring-1 ring-white/10 shadow-lg">
        <img
          src={imgSrc}
          alt={movie.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ imageRendering: 'auto' }}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {movie.quality && (
          <span className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-lg">
            {movie.quality}
          </span>
        )}
        {isNewMovie(movie) && (
          <span className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-lg">
            Mới
          </span>
        )}
        {movie.lang && (
          <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
            {movie.lang}
          </span>
        )}
        {movie.episode_current === 'Trailer' ? (
          <span className="absolute bottom-2 right-2 bg-amber-500/90 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">
            Trailer
          </span>
        ) : movie.episode_current === '0' ? (
          <span className="absolute bottom-2 right-2 bg-amber-500/90 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">
            Sắp chiếu
          </span>
        ) : movie.episode_current ? (
          <span className="absolute bottom-2 right-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">
            {movie.episode_current}
          </span>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="rounded-full bg-pink-600 p-4 shadow-2xl ring-4 ring-white/20 transition transform scale-90 group-hover:scale-100">
            <Play className="text-white w-7 h-7" fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-sm text-white truncate group-hover:text-pink-400 transition-colors">
          {movie.name}
        </h3>
        <div className="flex justify-between items-center mt-1.5 gap-2">
          <span className="text-gray-400 text-xs truncate flex-1">{movie.origin_name}</span>
          {movie.year && (
            <span className="text-pink-500 text-xs font-semibold shrink-0">{movie.year}</span>
          )}
        </div>
      </div>
    </>
  );

  if (!slug) {
    return <article className="group rounded-2xl overflow-hidden bg-gray-800/60 border border-gray-700/50 shadow-lg">{content}</article>;
  }

  return (
    <Link
      to={`/phim/${slug}`}
      className="group block cursor-pointer rounded-2xl overflow-hidden bg-gray-800/40 border border-gray-700/50 shadow-xl hover:shadow-pink-500/15 hover:shadow-2xl hover:border-pink-500/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      {content}
    </Link>
  );
};

export default MovieCard;
