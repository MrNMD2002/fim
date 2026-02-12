import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Home from './pages/Home';
import CatalogPage from './pages/CatalogPage';
import SinglePage from './pages/SinglePage';
import EpisodePage from './pages/EpisodePage';
import NotFound from './pages/NotFound';

function RedirectSearch() {
  const { keyword } = useParams();
  return <Navigate to={keyword ? `/?search=${encodeURIComponent(keyword)}` : '/'} replace />;
}
function RedirectCategory() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/the-loai/${encodeURIComponent(slug)}` : '/'} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/danh-sach/:slug" element={<CatalogPage />} />
        <Route path="/the-loai/:slug" element={<CatalogPage />} />
        <Route path="/quoc-gia/:slug" element={<CatalogPage />} />
        <Route path="/phim/:movieSlug/tap/:episodeId" element={<EpisodePage />} />
        <Route path="/phim/:movieSlug/tap-:episodeId" element={<EpisodePage />} />
        <Route path="/phim/:movieSlug" element={<SinglePage />} />
        <Route path="/search/:keyword" element={<RedirectSearch />} />
        <Route path="/category/:slug" element={<RedirectCategory />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
