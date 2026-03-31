import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Check, Palette, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ClassicTheme from "../templates/ClassicTheme.html?raw";
import DarkTheme from "../templates/DarkTheme.html?raw";
import MinimalistTheme from "../templates/MinimalistTheme.html?raw";
import CreativeTheme from "../templates/CreativeTheme.html?raw";

import PreviewClassic from "../templates/PreviewClassic.html?raw";
import PreviewDark from "../templates/PreviewDark.html?raw";
import PreviewMinimalist from "../templates/PreviewMinimalist.html?raw";
import PreviewCreative from "../templates/PreviewCreative.html?raw";

export default function Templates() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();

  const templates = [
    {
      id: "classic",
      name: "Classic Theme",
      description: "Clean and professional design perfect for any industry",
      icon: "💼",
      preview: PreviewClassic,
      content: ClassicTheme,
    },
    {
      id: "dark",
      name: "Dark Theme",
      description: "Modern dark theme for developers",
      icon: "🌙",
      preview: PreviewDark,
      content: DarkTheme,
    },
    {
      id: "minimal",
      name: "Minimalist",
      description: "Clean and minimal design focusing on content",
      icon: "🎨",
      preview: PreviewMinimalist,
      content: MinimalistTheme,
    },
    {
      id: "creative",
      name: "Creative Portfolio",
      description: "Vibrant and artistic design",
      icon: "🎭",
      preview: PreviewCreative,
      content: CreativeTheme,
    },
  ];

  const handlePreview = (html) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleDownload = (template) => {
    const blob = new Blob([template.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.id}.html`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden px-6 py-10">

      {/* 🔥 GLOBAL GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      <div className="relative z-10">

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Choose Your <span className="text-green-400">Template</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Pick a design that represents you best
          </p>
        </motion.div>

        {/* GRID */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">

          {templates.map((t, index) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className={`p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg transition-all
              ${
                selectedTemplate === t.id
                  ? "ring-2 ring-green-400 shadow-green-500/20"
                  : "hover:shadow-green-500/20"
              }`}
            >
              {/* ICON */}
              <div className="text-5xl mb-4">{t.icon}</div>

              {/* TITLE */}
              <h2 className="text-xl font-semibold mb-2">
                {t.name}
              </h2>

              <p className="text-gray-400 text-sm mb-6">
                {t.description}
              </p>

              {/* BUTTONS */}
              <div className="flex gap-4">

                {/* PREVIEW */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePreview(t.preview)}
                  className="flex-1 px-4 py-3 rounded-lg border border-white/20 text-sm flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <Eye size={16}/> Preview
                </motion.button>

                {/* SELECT */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2 font-medium transition-all
                  ${
                    selectedTemplate === t.id
                      ? "bg-green-500 text-black"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {selectedTemplate === t.id ? (
                    <>
                      <Check size={16}/> Selected
                    </>
                  ) : (
                    <>
                      <Palette size={16}/> Select
                    </>
                  )}
                </motion.button>

              </div>
            </motion.div>
          ))}
        </div>

        {/* ACTION BAR */}
        <div className="max-w-5xl mx-auto mt-16">

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">

            <div>
              <p className="text-gray-400 text-sm">Selected Template</p>
              <h3 className="text-lg font-semibold">
                {selectedTemplate || "None"}
              </h3>
            </div>

            <div className="flex gap-3 flex-wrap">

              {/* CLEAR */}
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
              >
                Clear
              </button>

              {/* DOWNLOAD */}
              {selectedTemplate && (
                <button
                  onClick={() =>
                    handleDownload(
                      templates.find(t => t.id === selectedTemplate)
                    )
                  }
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm flex items-center gap-2 hover:bg-yellow-300"
                >
                  <Download size={16}/> Download
                </button>
              )}

              {/* USE TEMPLATE */}
              <button
                onClick={() =>
                  navigate("/form", { state: { selectedTemplate } })
                }
                disabled={!selectedTemplate}
                className="px-6 py-2 rounded-lg bg-green-500 text-black font-medium hover:bg-green-400 disabled:opacity-40"
              >
                Use Template
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}