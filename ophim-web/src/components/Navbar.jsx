import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Menu, X } from 'lucide-react';
import { api } from '../services/api';
import { getBannerMessage } from '../constants/specialDays';

function normalizeCategories(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data?.items) return data.data.items;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items) return data.items;
  return [];
}

const VIETNAM_ENTRY = { slug: 'viet-nam', name: 'Việt Nam', _id: 'viet-nam' };

function normalizeCountries(data) {
  if (!data) return [];
  let list = Array.isArray(data) ? data : (data.data?.items ?? data.data ?? data.items ?? []);
  if (!Array.isArray(list)) list = [];
  const hasVietnam = list.some((c) => (c.slug || '').toLowerCase() === 'viet-nam');
  if (!hasVietnam) list = [VIETNAM_ENTRY, ...list];
  // Web cho người Việt: đưa Việt Nam lên đầu danh sách
  const vn = list.filter((c) => (c.slug || '').toLowerCase() === 'viet-nam');
  const rest = list.filter((c) => (c.slug || '').toLowerCase() !== 'viet-nam');
  return [...vn, ...rest];
}

const Navbar = () => {
  const [keyword, setKeyword] = useState('');
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const bannerText = getBannerMessage();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoriesLoading(true);
      const data = await api.getCategories();
      if (!cancelled) {
        setCategories(normalizeCategories(data));
        setCategoriesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCountriesLoading(true);
      const data = await api.getCountries();
      if (!cancelled) {
        setCountries(normalizeCountries(data));
        setCountriesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/?search=${encodeURIComponent(keyword.trim())}`);
      setKeyword('');
      setIsMenuOpen(false);
    }
  };

  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const dropdownContent = categoriesLoading
    ? (<span className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500"><span className="inline-block w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /> Đang tải...</span>)
    : categories.length > 0
      ? categories.map((cat) => (
          <Link
            key={cat._id || cat.slug}
            to={`/the-loai/${cat.slug}`}
            className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-pink-600/20 hover:text-pink-400 transition-colors border-l-2 border-transparent hover:border-pink-500"
            onClick={() => setIsDropdownOpen(false)}
          >
            {cat.name}
          </Link>
        ))
      : (<span className="block px-4 py-2 text-sm text-gray-500">Không có thể loại</span>);

  return (
    <nav className="sticky top-0 z-[100] shadow-lg">
      <div className="bg-pink-200/90 text-gray-800 text-center py-2 px-4 text-sm font-medium">
        {bannerText}
      </div>
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/80">
        <div className="container mx-auto flex justify-between items-center px-4 py-3">
        <Link to="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 via-pink-600 to-rose-500 bg-clip-text text-transparent hover:opacity-90 transition-opacity tracking-tight">
          GocchillcuaBeu
        </Link>

        <button type="button" className="md:hidden p-2 text-white rounded-lg hover:bg-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-300 hover:text-white font-medium transition-colors">Trang chủ</Link>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
              onClick={(e) => { e.stopPropagation(); setIsDropdownOpen((v) => !v); }}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              Thể loại
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-gray-800/95 backdrop-blur border border-gray-700 rounded-xl shadow-2xl py-2 z-50 max-h-[70vh] overflow-y-auto">
                {dropdownContent}
              </div>
            )}
          </div>

          <div className="relative" ref={countryRef}>
            <button
              type="button"
              className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
              onClick={(e) => { e.stopPropagation(); setCountryOpen((v) => !v); }}
              aria-expanded={countryOpen}
              aria-haspopup="true"
            >
              Quốc gia
              <ChevronDown className={`w-4 h-4 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
            </button>
            {countryOpen && (
              <div className="absolute left-0 mt-1.5 w-52 max-h-[70vh] overflow-y-auto bg-gray-800/95 backdrop-blur border border-gray-700 rounded-xl shadow-2xl py-2 z-50">
                {countriesLoading ? (
                  <span className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                    <span className="inline-block w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /> Đang tải...
                  </span>
                ) : countries.length > 0 ? (
                  countries.map((c) => (
                    <Link
                      key={c._id || c.slug}
                      to={`/quoc-gia/${c.slug}`}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-pink-600/20 hover:text-pink-400 transition-colors"
                      onClick={() => setCountryOpen(false)}
                    >
                      {c.name}
                    </Link>
                  ))
                ) : (
                  <span className="block px-4 py-2 text-sm text-gray-500">Không có quốc gia</span>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm phim..."
              className="bg-gray-800/80 text-white pl-4 pr-10 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:bg-gray-800 w-44 transition-all placeholder:text-gray-500"
            />
            <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-400 transition-colors" aria-label="Tìm kiếm">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-gray-900/98 backdrop-blur border-b border-gray-800 p-4 md:hidden z-40 animate-fade-in">
          <Link to="/" className="block py-2 text-white font-medium" onClick={() => setIsMenuOpen(false)}>Trang chủ</Link>
          <div className="text-gray-500 text-xs uppercase tracking-wider mt-3 mb-2">Thể loại</div>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
            {categoriesLoading ? (
              <div className="col-span-2 py-4 flex items-center justify-center gap-2 text-gray-500">
                <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /> Đang tải...
              </div>
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat._id || cat.slug}
                  to={`/the-loai/${cat.slug}`}
                  className="py-2 px-3 text-sm text-gray-300 hover:text-pink-400 hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))
            )}
          </div>
          <div className="text-gray-500 text-xs uppercase tracking-wider mt-3 mb-2">Quốc gia</div>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
            {countriesLoading ? (
              <div className="col-span-2 py-4 flex items-center justify-center gap-2 text-gray-500">
                <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /> Đang tải...
              </div>
            ) : countries.length > 0 ? (
              countries.map((c) => (
                <Link
                  key={c._id || c.slug}
                  to={`/quoc-gia/${c.slug}`}
                  className="py-2 px-3 text-sm text-gray-300 hover:text-pink-400 hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {c.name}
                </Link>
              ))
            ) : (
              <span className="col-span-2 text-sm text-gray-500">Không có quốc gia</span>
            )}
          </div>
          <form onSubmit={handleSearch} className="relative mt-4">
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm phim..."
              className="bg-gray-800 w-full text-white pl-4 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
