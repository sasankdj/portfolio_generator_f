import React from 'react';
import { usePortfolio } from './PortfolioContext';

const GlobalLoader = () => {
  const { loading } = usePortfolio();

  if (!loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default GlobalLoader;