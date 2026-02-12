import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Không tìm thấy trang này.</p>
        <Link to="/" className="inline-block px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-medium transition-colors">
          Về Trang chủ
        </Link>
      </div>
      <Footer />
    </div>
  );
}

export default NotFound;
