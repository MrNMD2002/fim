import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    setError(null);
    if (!src) return;

    const onVideoError = () => {
      setError('load_failed');
    };

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError('load_failed');
      });

      video.addEventListener('error', onVideoError);
      return () => {
        video.removeEventListener('error', onVideoError);
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
      video.addEventListener('error', onVideoError);
      return () => video.removeEventListener('error', onVideoError);
    }
  }, [src]);

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-xl flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-300 mb-2">Không tải được phim.</p>
        <p className="text-gray-500 text-sm max-w-md mb-4">
          Trên bản deploy (Railway) nguồn video thường chặn IP server (403). Bạn chạy local (<code className="bg-gray-700 px-1 rounded">npm run dev</code>) hoặc deploy lên VPS để xem ổn định.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-xl">
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default VideoPlayer;
