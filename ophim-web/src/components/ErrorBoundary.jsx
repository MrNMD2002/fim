import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-bold text-gray-300 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Để tớ sửa giúp Bệu, thử tải lại trang hoặc về Trang chủ nha.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-medium transition-colors"
            >
              Tải lại
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
