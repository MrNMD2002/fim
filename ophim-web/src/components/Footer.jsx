import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, Layers, Search } from 'lucide-react';

const SITE = {
  name: 'GocchillcuaBeu',
  tagline: 'Góc chill của Bệu',
};

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-gray-800/80 bg-gray-900/50">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 shadow-lg shadow-pink-900/30">
              <Film className="h-5 w-5 text-white" />
            </span>
            <div>
              <Link to="/" className="text-lg font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
                {SITE.name}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">{SITE.tagline}</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-6">
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors">
              <Home className="h-4 w-4" /> Trang chủ
            </Link>
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors">
              <Search className="h-4 w-4" /> Tìm phim
            </Link>
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <Layers className="h-4 w-4" /> Thể loại (trên menu)
            </span>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
          <p>© {currentYear} {SITE.name}. Nội dung từ nguồn công khai, chỉ dùng cho mục đích giải trí.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
