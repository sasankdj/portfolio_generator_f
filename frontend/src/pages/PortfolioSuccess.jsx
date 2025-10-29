import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { usePortfolio } from '../components/PortfolioContext';

import { Eye, Download, UploadCloud, Edit } from 'lucide-react';

const PortfolioSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userDetails, downloadPortfolioHtml, updateUserDetails } = usePortfolio();
  const { portfolioUrl, template } = location.state || {};

  useEffect(() => {
    // Redirect if the user lands here without a portfolio URL
    if (!portfolioUrl) {
      navigate('/form');
    }
  }, [portfolioUrl, navigate]);

  if (!portfolioUrl) {
    return null;
  }

  const handleEdit = () => {
    navigate('/form', { state: { selectedTemplate: template } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg text-center">
        <div className="mx-auto w-24 h-24 flex items-center justify-center bg-green-100 rounded-full">
          <span className="text-5xl">🎉</span>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mt-6">Your portfolio is successfully created!</h1>
        <p className="text-gray-600 mt-2">
          Congratulations! What would you like to do next?
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-center gap-4">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <Eye size={20} /> View Portfolio
          </a>
          <button
            onClick={() => downloadPortfolioHtml(template, userDetails)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
          >
            <Download size={20} /> Download
          </button>
          <button
            onClick={() => navigate('/deployment')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors cursor-pointer"
          >
            <UploadCloud size={20} /> Deploy Online
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors cursor-pointer"
          >
            <Edit size={20} /> Edit Details
          </button>
        </div>

        <div className="mt-8">
          <Link to="/home" className="text-blue-600 hover:underline">Go back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSuccess;