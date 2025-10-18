import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Check, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../components/PortfolioContext';
import { toast } from 'react-toastify';
import Resume1Preview from '../resumes/resume1.html?raw'; // Using the same for preview
import Resume2Preview from '../resumes/resume2.html?raw'; // New template preview

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ResumeTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const { userDetails } = usePortfolio();
  const navigate = useNavigate();

  const templates = [
    {
      id: 'resume1',
      name: 'Classic Resume',
      description: 'A clean and professional ATS-friendly resume template.',
      icon: '📄',
      content: Resume1Preview,
      gradient: 'from-gray-700 to-gray-900',
      previewGradient: 'from-gray-200 to-gray-400',
    },
    {
      id: 'resume2',
      name: 'Modern Resume',
      description: 'A sleek and contemporary resume template with a clean layout.',
      icon: '📋',
      content: Resume2Preview,
      gradient: 'from-blue-700 to-blue-900',
      previewGradient: 'from-blue-200 to-blue-400',
    },
  ];

  const handleSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: userDetails,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const data = await response.json();

      toast.success('Resume created successfully!');
      navigate('/resume-success', { state: { resumeHtml: data.html, template: selectedTemplate } });
    } catch (error) {
      console.error('Error creating resume:', error);
      toast.error('Error creating resume. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 font-sans">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative mx-6 md:mx-12 mt-8 rounded-3xl bg-gradient-to-r from-gray-700 via-gray-800 to-black p-12 shadow-2xl"
      >
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Choose Your Resume Template</h1>
          <p className="text-xl md:text-2xl font-light opacity-90">Select a template to generate your professional resume.</p>
        </div>
      </motion.div>

      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">Preview: {previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="h-[70vh] overflow-auto">
              <iframe srcDoc={previewTemplate.content} className="w-full h-full border-0" title={`Preview of ${previewTemplate.name}`} />
            </div>
          </motion.div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden"
            >
              <div className={`h-48 bg-gradient-to-br ${template.previewGradient} relative p-8 flex items-center justify-center`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">{template.icon}</div>
                  <div className={`inline-block px-6 py-3 bg-gradient-to-r ${template.gradient} text-white rounded-full text-lg font-semibold shadow-lg`}>
                    {template.name}
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{template.name}</h3>
                <p className="text-gray-600 mb-6">{template.description}</p>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border rounded-xl font-medium"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white ${selectedTemplate === template.id ? 'bg-green-500' : 'bg-blue-500'}`}
                    onClick={() => handleSelect(template.id)}
                  >
                    {selectedTemplate === template.id ? <Check className="w-4 h-4" /> : ''}
                    {selectedTemplate === template.id ? 'Selected' : 'Select'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleUseTemplate}
            disabled={!selectedTemplate}
            className="px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 bg-gradient-to-r from-green-500 to-teal-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create Resume
          </motion.button>
        </div>
      </main>
    </div>
  );
}