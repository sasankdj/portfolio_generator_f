import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Eye, ArrowLeft, FileText, File, Loader } from 'lucide-react';
import { usePortfolio } from '../components/PortfolioContext';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ResumeSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { resumeUrl, resumeHtml, template } = state || {}; // template is passed from ResumeTemplates page
  const { userDetails } = usePortfolio();
  const [loadingFormat, setLoadingFormat] = useState(null);

  const handlePrintToPdf = async () => {
    setLoadingFormat('pdf');

    // Open the window immediately to avoid popup blockers.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups for this site to print your resume.");
      setLoadingFormat(null);
      return;
    }
    printWindow.document.write('<html><head><title>Printing Resume</title></head><body><p>Preparing your resume for printing...</p></body></html>');

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: userDetails, template }),
      });
      if (!response.ok) throw new Error('Failed to load resume for printing.');
      
      const { html } = await response.json();
      
      // Write the resume content and the print script to the new window.
      printWindow.document.open();
      printWindow.document.write(html);
      // This script will run after the content is loaded.
      printWindow.document.write('<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } };</script>');
      printWindow.document.close();

    } catch {
      printWindow.close(); // Close the popup on error
      toast.error('Could not prepare PDF for printing.');
    } finally {
      setLoadingFormat(null);
    }
  };

  const handleDownload = async (format) => {
    if (!template) {
      toast.error("Template information is missing. Please go back and try again.");
      return;
    }
    setLoadingFormat(format);
    try {
      const response = await fetch(`${API_BASE_URL}/api/download-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: userDetails,
          template: template,
          format: format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format} file.`);
      }

      const fileName = `resume.${format}`;
      // The server now sends the file directly, so we can get it as a blob.
      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(fileUrl);

      toast.success(`Successfully downloaded ${format.toUpperCase()}!`);
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
      toast.error(`Could not download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setLoadingFormat(null);
    }
  };

  const handlePreview = async () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    } else if (resumeHtml) {
      const blob = new Blob([resumeHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } else {
      // Fetch the resume HTML if not available
      try {
        const response = await fetch(`${API_BASE_URL}/api/generate-resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: userDetails, template }),
        });
        if (!response.ok) throw new Error('Failed to generate resume for preview.');
        const { html } = await response.json();
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (error) {
        console.error('Error generating resume for preview:', error);
        toast.error('Could not load preview. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full text-center">
        <div className="mx-auto w-24 h-24 flex items-center justify-center bg-green-100 rounded-full">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-2">Success!</h1>
        <p className="text-gray-600 mb-8">Your professional resume has been generated.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center">
          <button onClick={handlePrintToPdf} disabled={loadingFormat === 'pdf'} className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400">
            {loadingFormat === 'pdf' ? <Loader className="animate-spin" size={20} /> : <FileText size={20} />}
            Download PDF
          </button>
          <button onClick={() => handleDownload('docx')} disabled={loadingFormat === 'docx'} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400">
            {loadingFormat === 'docx' ? <Loader className="animate-spin" size={20} /> : <File size={20} />}
            Download DOCX
          </button>
          <button onClick={handlePreview} className="sm:col-span-2 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
            <Eye size={20} /> Preview
          </button>
          <button onClick={() => navigate('/resume-templates')} className="sm:col-span-2 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            🎨 Change Template
          </button>
        </div>
        <button onClick={() => navigate('/home')} className="flex items-center justify-center gap-2 mt-8 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>
    </div>
  );
};

export default ResumeSuccess;