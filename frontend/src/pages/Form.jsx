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

  // const [formData, setFormData] = useState(userDetails);
  const [formData, setFormData] = useState(() => {
  const saved = localStorage.getItem("portfolioFormData");
  return saved ? JSON.parse(saved) : userDetails;
});

  // useEffect(() => {
  //   setFormData(prevFormData => ({
  //     ...userDetails,
  //     image: userDetails.image || prevFormData.image,
  //   }));
  // }, [userDetails]);
useEffect(() => {
  localStorage.setItem("portfolioFormData", JSON.stringify(formData));
}, [formData]);
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
const clearForm = () => {
  const confirmClear = window.confirm("Are you sure you want to clear all data?");
  
  if (!confirmClear) return;

  const emptyData = {
    fullName: "",
    email: "",
    phone: "",
    portfolioLink: "",
    linkedin: "",
    github: "",
    headline: "",
    careerObjective: "",
    skills: [],
    projects: [],
    experience: [],
    education: [],
    achievements: [],
    image: ""
  };

  setFormData(emptyData);

  // 🔥 remove from localStorage
  localStorage.removeItem("portfolioFormData");

  toast.info("Form cleared successfully 🧹");
};

  return (
  <div className="min-h-screen bg-[#0a0a0a] p-6 relative overflow-hidden">

    {/* Glow */}
    <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
    <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

    <div className="max-w-5xl mx-auto z-10 relative">

      {/* BACK BUTTON */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/templates')}
          className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition"
        >
          ← Back to Templates
        </button>
      </div>

      {/* FORM CARD */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">
          Portfolio Details
        </h1>

        <FormInputs
          formData={formData}
          setFormData={setFormData}
          uploadResume={uploadResume}
          loading={loading}
        />
      </div>

      {/* ACTIONS */}
      <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">

        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Actions
        </h2>

        {/* SAVE */}
        <div className="mb-6 text-center">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-500 text-black rounded-lg hover:bg-green-400 transition shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          >
            Save Details
          </button>
        </div>
      <div className="mb-6 text-center">
  <button
    onClick={clearForm}
    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-400 transition"
  >
    Clear Form
  </button>
</div>
        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* PORTFOLIO */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">

            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Portfolio Website
            </h3>

            <div className="space-y-3">

              <button
                onClick={downloadHtmlFile}
                className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Download HTML
              </button>

              <button
                onClick={previewInNewTab}
                className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Preview
              </button>

              <button
                onClick={createAndNavigate}
                className="w-full py-3 bg-green-500 text-black rounded-lg hover:bg-green-400 transition"
              >
                Create Portfolio
              </button>

              <button
                onClick={() => navigate('/templates')}
                className="w-full py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition"
              >
                Change Template
              </button>

            </div>
          </div>

          {/* RESUME */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">

            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Resume
            </h3>

            <div className="space-y-3">

              <button
                onClick={() => navigate('/resume-templates')}
                className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Download PDF
              </button>

              <button
                onClick={() => navigate('/resume-templates')}
                className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Download DOCX
              </button>

              <button
                onClick={() => navigate('/resume-templates')}
                className="w-full py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition"
              >
                Create Resume
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>

    <Chatbot />
    <Footer />
  </div>
);
  
}

export default Form;