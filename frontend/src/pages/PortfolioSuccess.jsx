import React, { useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { usePortfolio } from "../components/PortfolioContext";
import { motion } from "framer-motion";

import {
  Eye,
  Download,
  UploadCloud,
  Edit,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

const PortfolioSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userDetails, downloadPortfolioHtml } = usePortfolio();
  const { portfolioUrl, template } = location.state || {};

  useEffect(() => {
    if (!portfolioUrl) {
      navigate("/form");
    }
  }, [portfolioUrl, navigate]);

  if (!portfolioUrl) return null;

  const handleEdit = () => {
    navigate("/form", { state: { selectedTemplate: template } });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 relative overflow-hidden">

      {/* 🔥 GLOBAL GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg text-center"
      >
        {/* ICON */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="text-green-400 w-16 h-16" />
        </div>

        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Portfolio <span className="text-green-400">Created</span>
        </h1>

        <p className="text-gray-400 mb-10">
          Your portfolio is live and ready to share 🚀
        </p>

        {/* ACTION GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* VIEW */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-black font-medium hover:bg-green-400"
          >
            <Eye size={18} /> View
          </motion.a>

          {/* DOWNLOAD */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              downloadPortfolioHtml(template, userDetails)
            }
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-300"
          >
            <Download size={18} /> Download
          </motion.button>

          {/* DEPLOY */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/deployment")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20"
          >
            <UploadCloud size={18} /> Deploy
          </motion.button>

          {/* EDIT */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10"
          >
            <Edit size={18} /> Edit
          </motion.button>
        </div>

        {/* BACK */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center justify-center gap-2 mt-10 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default PortfolioSuccess;