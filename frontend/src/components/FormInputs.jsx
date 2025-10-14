import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { usePortfolio } from "./PortfolioContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FormInputs = ({ formData, setFormData }) => {
  const [isParsingResume, setIsParsingResume] = useState(false);
  const { setLoading: setGlobalLoading } = usePortfolio();
  const [enhancing, setEnhancing] = useState(false);
  const fileInputRef = useRef(null);
  const [globallyEnhancedData, setGloballyEnhancedData] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProjectChange = (index, e) => {
    const { name, value } = e.target;
    const newProjects = [...(formData.projects || [])];
    newProjects[index] = { ...newProjects[index], [name]: value };
    setFormData({ ...formData, projects: newProjects });
  };

  const handleExperienceChange = (index, e) => {
    const { name, value } = e.target;
    const newExperience = [...(formData.experience || [])];
    newExperience[index] = { ...newExperience[index], [name]: value };
    setFormData({ ...formData, experience: newExperience });
  };

  const handleResponsibilitiesChange = (index, e) => {
    const newExperience = [...(formData.experience || [])];
    newExperience[index] = {
      ...newExperience[index],
      responsibilities: e.target.value.split("\n"),
    };
    setFormData({ ...formData, experience: newExperience });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData({ ...formData, image: event.target.result });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Upload Resume & Autofill Form
  const uploadResume = async (file) => {
    if (!file) return;
    const formDataFile = new FormData();
    formDataFile.append("resume", file);
    setIsParsingResume(true);
    setGlobalLoading(true);

    const toastId = toast.loading("Uploading resume...");

    try {
      const resp = await fetch(`${API_BASE_URL}/api/upload-resume`, {
        method: "POST",
        body: formDataFile,
      });

      if (!resp.ok) {
        toast.update(toastId, { render: "Upload failed.", type: "error", isLoading: false, autoClose: 5000 });
        const errorData = await resp.json().catch(() => ({ error: "Failed to parse resume. The server returned an invalid response." }));
        throw new Error(errorData.error || `Server responded with status ${resp.status}`);
      }

      toast.update(toastId, { render: "Resume uploaded. Parsing with AI...", type: "info", isLoading: true });
      const data = await resp.json();

      toast.update(toastId, { render: "Successfully parsed resume!", type: "success", isLoading: false, autoClose: 5000 });
      setFormData((prev) => ({
        ...prev,
        fullName: data.fullName || prev.fullName,
        headline: data.headline || prev.headline,
        email: data.email || prev.email,
        linkedin: data.linkedin || prev.linkedin,
        careerObjective: data.careerObjective || prev.careerObjective,
        skills: Array.isArray(data.skills)
          ? data.skills.join(", ")
          : data.skills || prev.skills,
        projects: Array.isArray(data.projects) ? data.projects : prev.projects,
        experience: Array.isArray(data.experience)
          ? data.experience
          : prev.experience,
        achievements: Array.isArray(data.achievements)
          ? data.achievements.join("\n")
          : data.achievements || prev.achievements,
      }));
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: err.message || "Failed to parse resume.", type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsParsingResume(false);
      setGlobalLoading(false);
      if (toast.isActive(toastId) && toast.isLoading(toastId)) {
        toast.dismiss(toastId);
      }
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (file) await uploadResume(file);
  };



  // Enhance All with AI
  const enhanceAllWithAI = async () => {
    setEnhancing(true);
    setGlobalLoading(true);
    setGloballyEnhancedData(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/enhance-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });

      if (!resp.ok) {
        throw new Error("Failed to get AI enhancement.");
      }

      const data = await resp.json();
      setGloballyEnhancedData(data.enhancedData);
      toast.success("AI suggestions are ready for your review!");
    } catch (err) {
      console.error(err);
      toast.error("Error enhancing portfolio. Please try again.");
    } finally {
      setEnhancing(false);
      setGlobalLoading(false);
    }
  };

  const acceptGlobalEnhancement = () => {
    if (globallyEnhancedData) {
      setFormData(prev => ({ ...prev, ...globallyEnhancedData }));
      setGloballyEnhancedData(null);
      toast.success("Portfolio details have been updated with AI suggestions!");
    }
  };

  const rejectGlobalEnhancement = () => {
    setGloballyEnhancedData(null);
  };

  return (
    <div className="space-y-8">
      {/* Global AI Enhance Button */}
      <div className="p-4 border rounded-lg bg-gray-50 text-center">
        <button
          onClick={enhanceAllWithAI}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-transform transform hover:scale-105 shadow-lg"
          disabled={enhancing}
        >
          {enhancing ? "Enhancing..." : "✨ Enhance All with AI"}
        </button>
        <p className="text-sm text-gray-500 mt-2">Let AI review and improve your entire portfolio content.</p>
      </div>

      {/* Personal Details */}
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Personal Details</h3>
        <div className="mt-4 border-t pt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleResumeChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            disabled={isParsingResume}
          >
            {isParsingResume ? "Parsing..." : "📄 Upload Resume & Autofill"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Full Name"
            className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
          />
          <input
            name="linkedin"
            value={formData.linkedin}
            onChange={handleInputChange}
            placeholder="LinkedIn URL"
            className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
          />
          <input
            name="headline"
            value={formData.headline}
            onChange={handleInputChange}
            placeholder="Headline (e.g., Senior Software Engineer)"
            className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1 md:col-span-2"
          />
        </div>
        <div className="mt-4">
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
          />
          {formData.image && (
            <img
              src={formData.image}
              alt="Preview"
              className="mt-4 w-32 h-32 rounded-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Professional Summary */}
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Professional Summary</h3>
        <textarea
          name="careerObjective"
          value={formData.careerObjective}
          onChange={handleInputChange}
          placeholder="Career Objective / Professional Bio"
          className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1 h-24"
        />
        {globallyEnhancedData?.careerObjective && (
          <div className="mt-4 p-4 border-l-4 border-purple-400 bg-purple-50">
            <h4 className="font-semibold text-purple-800">AI Suggestion for Summary:</h4>
            <p className="text-gray-700 italic mt-1">{globallyEnhancedData.careerObjective}</p>
          </div>
        )}
      </div>

      {/* AI Suggestions Control */}
      {globallyEnhancedData && (
        <div className="p-6 border-2 border-dashed border-green-500 rounded-lg bg-green-50 text-center">
          <h3 className="text-xl font-bold text-green-800">AI Suggestions Ready!</h3>
          <p className="text-gray-600 my-3">AI has enhanced your portfolio. You can see suggestions below each section. Apply all changes or reject them.</p>
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={acceptGlobalEnhancement} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              ✅ Accept All
            </button>
            <button onClick={rejectGlobalEnhancement} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              ❌ Reject
            </button>
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Skills</h3>
        <input
          name="skills"
          value={formData.skills}
          onChange={handleInputChange}
          placeholder="Skills (comma-separated)"
          className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
        />
      </div>

      {/* Projects */}
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Projects</h3>
        {Array.isArray(formData.projects) &&
          formData.projects.map((project, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded"
            >
              <input
                name="title"
                value={project.title || ""}
                onChange={(e) => handleProjectChange(index, e)}
                placeholder={`Project ${index + 1} Title`}
                className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
              />
              <input
                name="description"
                value={project.description || ""}
                onChange={(e) => handleProjectChange(index, e)}
                placeholder="Description"
                className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
              />
              <input
                name="technologies"
                value={project.technologies || ""}
                onChange={(e) => handleProjectChange(index, e)}
                placeholder="Technologies"
                className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
              />
              {globallyEnhancedData?.projects?.[index] && (
                <div className="md:col-span-3 mt-2 p-3 border-l-4 border-purple-400 bg-purple-50 rounded-r-lg">
                   <h4 className="font-semibold text-purple-800 text-sm">AI Suggestion for Project {index + 1}:</h4>
                   <p className="text-sm text-gray-700 mt-1"><strong>Title:</strong> {globallyEnhancedData.projects[index].title}</p>
                   <p className="text-sm text-gray-700 mt-1"><strong>Description:</strong> {globallyEnhancedData.projects[index].description}</p>
                   <p className="text-sm text-gray-700 mt-1"><strong>Technologies:</strong> {globallyEnhancedData.projects[index].technologies}</p>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Experience */}
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Experience</h3>
        {Array.isArray(formData.experience) &&
          formData.experience.map((exp, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <input
                name="jobTitle"
                value={exp.jobTitle || ""}
                onChange={(e) => handleExperienceChange(index, e)}
                placeholder="Job Title"
                className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
              />
              <input
                name="company"
                value={exp.company || ""}
                onChange={(e) => handleExperienceChange(index, e)}
                placeholder="Company"
                className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
              />
              <input
                name="duration"
                value={exp.duration || ""}
                onChange={(e) => handleExperienceChange(index, e)}
                placeholder="Duration"
                className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1"
              />
              <textarea
                value={(exp.responsibilities || []).join("\n")}
                onChange={(e) => handleResponsibilitiesChange(index, e)}
                placeholder="Responsibilities (one per line)"
                className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1 mt-2 h-24"
              />
            </div>
          ))}
      </div>

      {/* Achievements */}
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Achievements / Testimonials</h3>
        <textarea
          name="achievements"
          value={formData.achievements}
          onChange={handleInputChange}
          placeholder="Achievements or Testimonials"
          className="w-full p-3 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 mb-1 h-24"
        />
        {globallyEnhancedData?.achievements && (
          <div className="mt-4 p-4 border-l-4 border-purple-400 bg-purple-50">
            <h4 className="font-semibold text-purple-800">AI Suggestion for Achievements:</h4>
            <pre className="text-gray-700 italic mt-1 whitespace-pre-wrap font-sans">
              {globallyEnhancedData.achievements}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
};

export default FormInputs;
