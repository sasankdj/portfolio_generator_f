import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Download,
  Eye,
  ArrowLeft,
  FileText,
  File,
  Loader,
  CheckCircle,
} from "lucide-react";
import { usePortfolio } from "../components/PortfolioContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ResumeSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { resumeUrl, resumeHtml, template } = state || {};
  const { userDetails } = usePortfolio();
  const [loadingFormat, setLoadingFormat] = useState(null);

  const handlePrintToPdf = async () => {
    setLoadingFormat("pdf");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Allow popups to print resume.");
      setLoadingFormat(null);
      return;
    }

    printWindow.document.write("<p>Preparing PDF...</p>");

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: userDetails, template }),
      });

      if (!response.ok) throw new Error();

      const { html } = await response.json();

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.write(`
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }
        </script>
      `);
      printWindow.document.close();
    } catch {
      printWindow.close();
      toast.error("Failed to generate PDF.");
    } finally {
      setLoadingFormat(null);
    }
  };

  const handleDownload = async (format) => {
    setLoadingFormat(format);
    try {
      const response = await fetch(`${API_BASE_URL}/api/download-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: userDetails, template, format }),
      });

      if (!response.ok) throw new Error();

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `resume.${format}`;
      a.click();

      URL.revokeObjectURL(fileUrl);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch {
      toast.error(`Download failed`);
    } finally {
      setLoadingFormat(null);
    }
  };

  const handlePreview = async () => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank");
    } else if (resumeHtml) {
      const blob = new Blob([resumeHtml], { type: "text/html" });
      window.open(URL.createObjectURL(blob));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 relative overflow-hidden">

      {/* 🔥 Glow */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg text-center"
      >
        {/* ICON */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="text-green-400 w-16 h-16" />
        </div>

        {/* TEXT */}
        <h1 className="text-3xl font-bold mb-2">
          Resume <span className="text-green-400">Ready</span>
        </h1>

        <p className="text-gray-400 mb-8">
          Your professional resume has been generated successfully.
        </p>

        {/* BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* PDF */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrintToPdf}
            disabled={loadingFormat === "pdf"}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-black font-medium hover:bg-green-400 disabled:opacity-40"
          >
            {loadingFormat === "pdf" ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <FileText size={18} />
            )}
            PDF
          </motion.button>

          {/* DOCX */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDownload("docx")}
            disabled={loadingFormat === "docx"}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-300 disabled:opacity-40"
          >
            {loadingFormat === "docx" ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <File size={18} />
            )}
            DOCX
          </motion.button>

          {/* PREVIEW */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePreview}
            className="sm:col-span-2 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20"
          >
            <Eye size={18} /> Preview
          </motion.button>

          {/* CHANGE TEMPLATE */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/resume-templates")}
            className="sm:col-span-2 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10"
          >
            🎨 Change Template
          </motion.button>
        </div>

        {/* BACK */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center justify-center gap-2 mt-8 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default ResumeSuccess;