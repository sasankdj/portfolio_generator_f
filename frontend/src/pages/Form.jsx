import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useNavigation } from "react-router-dom";
import { toast } from "react-toastify";
import { usePortfolio } from "../components/PortfolioContext";
import { useAuth } from "../components/AuthContext";
import FormInputs from "../components/FormInputs";
import JSZip from 'jszip';
import Footer from "../components/Footer";
import Chatbot from "../components/Chatbot";
const API_BASE_URL = import.meta.env.VITE_API_URL;

function Form() {
  const { state } = useLocation();
  const { userDetails, updateUserDetails, uploadResume, loading, saveUserDetails } = usePortfolio();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const selectedTemplateId = state?.selectedTemplate || userDetails.template || 'classic';

  const [formData, setFormData] = useState(userDetails);

  useEffect(() => {
    setFormData(prevFormData => ({
      ...userDetails,
      image: userDetails.image || prevFormData.image,
    }));
  }, [userDetails]);

  useEffect(() => {
    // This effect runs when the component mounts or `state` changes.
    // If we just came from signup/login with the intent to create, do it now.
    if (isLoggedIn && state?.from && (state.from === '/signup' || state.from === '/login') && state.action === 'createPortfolio') {
      createAndNavigate();
    }
  }, [isLoggedIn, state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedFormData = { ...formData, template: selectedTemplateId };
    updateUserDetails(updatedFormData);
    // Also save to the database
    await saveUserDetails(updatedFormData);
  };

  const previewInNewTab = async () => {
    const updatedFormData = { ...formData, template: selectedTemplateId };
    updateUserDetails(updatedFormData); // Update context before action
    try {
      const response = await fetch(`${API_BASE_URL}/generate-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: updatedFormData,
          template: selectedTemplateId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate portfolio');
      }

      const data = await response.json();
      const blob = new Blob([data.html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      URL.revokeObjectURL(blobUrl); // Clean up the blob URL after opening
    } catch (error) {
      console.error('Error generating portfolio:', error);
      toast.error('Error generating portfolio. Please try again.');
    }
  };

  const createAndNavigate = async () => {
    const updatedFormData = { ...formData, template: selectedTemplateId };
    updateUserDetails(updatedFormData); // Update context before action

    if (!isLoggedIn) {
      // If user is not logged in, redirect to signup and pass the intent
      toast.info("Please create an account to save and generate your portfolio.");
      navigate('/signup', { state: { from: '/form', action: 'createPortfolio' } });
      return;
    }

    await saveUserDetails(updatedFormData); // Save details to backend
    try {
      const response = await fetch(`${API_BASE_URL}/generate-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: updatedFormData,
          template: selectedTemplateId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate portfolio');
      }

      const data = await response.json();
      const blob = new Blob([data.html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      toast.success("Portfolio created successfully!");
      // We pass the blob URL to the success page for previewing.
      navigate('/success', { state: { portfolioUrl: blobUrl, template: selectedTemplateId } });
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast.error('Error creating portfolio. Please try again.');
    }
  };

  const downloadHtmlFile = async () => {
  const updatedFormData = { ...formData, template: selectedTemplateId };
  updateUserDetails(updatedFormData); // Update context before action
  await saveUserDetails(updatedFormData); // Save details to backend
  try {
    const response = await fetch(`${API_BASE_URL}/generate-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData: updatedFormData,
        template: selectedTemplateId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate portfolio');
    }

    const data = await response.json();

    if (!data.html) {
      throw new Error('No HTML returned from server');
    }

    // Create a zip file containing index.html
    const zip = new JSZip();
    zip.file('index.html', data.html);

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'portfolio.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    toast.success('Portfolio downloaded successfully!');
  } catch (error) {
    console.error('Error downloading portfolio:', error);
    toast.error('Error downloading portfolio. Please try again.');
  }
};

  const downloadPdfFile = async () => {
    updateUserDetails(formData); // Update context before action
    await saveUserDetails(formData); // Save details to backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/download-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          template: selectedTemplateId,
          format: 'pdf',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF portfolio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Portfolio PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading portfolio PDF:', error);
      toast.error('Error downloading portfolio PDF. Please try again.');
    }
  };

  const downloadDocxFile = async () => {
    updateUserDetails(formData); // Update context before action
    await saveUserDetails(formData); // Save details to backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/download-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          template: selectedTemplateId,
          format: 'docx',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DOCX portfolio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Portfolio DOCX downloaded successfully!');
    } catch (error) {
      console.error('Error downloading portfolio DOCX:', error);
      toast.error('Error downloading portfolio DOCX. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-start">
          <button onClick={() => navigate('/templates')}
            className="px-6 py-3 border-2 border-gray-600 text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white transition duration-300 font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Templates
          </button>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg relative">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Portfolio Details</h1>
          <FormInputs formData={formData} setFormData={setFormData} uploadResume={uploadResume} loading={loading} />
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Actions</h2>

          {/* Common Actions */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Common Actions</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                className="flex items-center justify-center px-4 py-3 text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition"
                onClick={handleSubmit}
              >
                💾 Save Details
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Portfolio Website Section */}
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 text-center">Portfolio Website</h3>
              <div className="space-y-3">
                <button
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                  onClick={downloadHtmlFile}
                >
                  📄 Download HTML
                </button>
                <button
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                  onClick={previewInNewTab}
                >
                  👁️ Preview in New Tab
                </button>
                <button
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-green-500 rounded-lg hover:bg-green-600 transition"
                  onClick={createAndNavigate}
                >
                  ✨ Create Portfolio
                </button>
                <button
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition"
                  onClick={() => navigate('/templates')}
                >
                  🎨 Change Template
                </button>
              </div>
            </div>

            {/* Resume Section */}
            <div className="p-4 border rounded-lg bg-green-50">
              <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">ATS Resume</h3>
              <div className="space-y-3">
                <button
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                  onClick={()=>navigate('/resume-templates')}
                >
                  📄 Download PDF
                </button>
                <button
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                  onClick={()=>navigate('/resume-templates')}
                >
                  📄 Download DOCX
                </button>
                <button
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition"
                  onClick={() => navigate('/resume-templates')}
                >
                  📄 Create Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      </div><Chatbot />
      <Footer />
    </div>
    
  );
  
}

export default Form;