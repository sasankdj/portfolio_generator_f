import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePortfolio } from "../components/PortfolioContext";
import { toast } from "react-toastify";
import Resume1Preview from "../resumes/resume1.html?raw";
import Resume2Preview from "../resumes/resume2.html?raw";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ResumeTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const { userDetails, saveUserDetails } = usePortfolio();
  const navigate = useNavigate();

  const templates = [
    {
      id: "resume1",
      name: "Classic Resume",
      description:
        "A clean and professional ATS-friendly resume template.",
      icon: "📄",
      content: Resume1Preview,
    },
    {
      id: "resume2",
      name: "Modern Resume",
      description:
        "A sleek and contemporary resume template with a clean layout.",
      icon: "📋",
      content: Resume2Preview,
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
      toast.error("Please select a template first.");
      return;
    }

    await saveUserDetails(userDetails);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/generate-resume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData: userDetails,
            template: selectedTemplate,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate resume");

      const data = await response.json();

      toast.success("Resume created successfully!");
      navigate("/resume-success", {
        state: { resumeHtml: data.html, template: selectedTemplate },
      });
    } catch (error) {
      console.error(error);
      toast.error("Error creating resume.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden px-6 py-10">

      {/* 🔥 Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-4xl mx-auto mb-16 relative z-10"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Choose Your <span className="text-green-400">Resume</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Pick a template and generate a professional resume instantly.
        </p>
      </motion.div>

      {/* PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f0f0f] rounded-2xl w-full max-w-5xl overflow-hidden border border-white/10"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h3 className="text-xl font-semibold">
                {previewTemplate.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="h-[70vh]">
              <iframe
                srcDoc={previewTemplate.content}
                className="w-full h-full border-0 bg-white"
                title="preview"
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* TEMPLATE GRID */}
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto relative z-10">

        {templates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -8 }}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg hover:shadow-green-500/20 transition-all"
          >
            {/* ICON */}
            <div className="text-5xl mb-4">{template.icon}</div>

            <h3 className="text-xl font-semibold mb-2">
              {template.name}
            </h3>

            <p className="text-gray-400 text-sm mb-6">
              {template.description}
            </p>

            <div className="flex gap-4">

              {/* PREVIEW */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePreview(template)}
                className="flex-1 px-4 py-3 rounded-lg border border-white/20 text-sm flex items-center justify-center gap-2 hover:bg-white/10"
              >
                <Eye className="w-4 h-4" /> Preview
              </motion.button>

              {/* SELECT */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(template.id)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2 font-medium transition-all
                ${
                  selectedTemplate === template.id
                    ? "bg-green-500 text-black"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {selectedTemplate === template.id && (
                  <Check className="w-4 h-4" />
                )}
                {selectedTemplate === template.id
                  ? "Selected"
                  : "Select"}
              </motion.button>

            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-16 relative z-10">
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 25px rgba(34,197,94,0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUseTemplate}
          disabled={!selectedTemplate}
          className="px-8 py-4 rounded-full bg-green-500 text-black font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create Resume
        </motion.button>
      </div>
    </div>
  );
}