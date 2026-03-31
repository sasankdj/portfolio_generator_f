import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { usePortfolio } from "./PortfolioContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FormInputs = ({ formData, setFormData }) => {
  const [fetchedRepos, setFetchedRepos] = useState([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const { setLoading: setGlobalLoading } = usePortfolio();
  const suggestionsContainerRef = useRef(null);
  const reposContainerRef = useRef(null);
  const [enhancing, setEnhancing] = useState(false);
  const fileInputRef = useRef(null);
  const [globallyEnhancedData, setGloballyEnhancedData] = useState(null);
  const [newSkill, setNewSkill] = useState('');

  // Normalize skills to array, filter out empty strings
  const skillsArray = Array.isArray(formData.skills) ? formData.skills.filter(skill => skill.trim() !== '') : (formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s.trim() !== '') : []);

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      const updatedSkills = [...skillsArray, newSkill.trim()];
      setFormData({ ...formData, skills: updatedSkills });
      setNewSkill('');
      toast.success("Skill added.");
    }
  };

  const handleRemoveSkill = (index) => {
    const updatedSkills = skillsArray.filter((_, i) => i !== index);
    setFormData({ ...formData, skills: updatedSkills });
    toast.info("Skill removed.");
  };

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

  const handleDeleteProject = (index) => {
    const newProjects = [...(formData.projects || [])];
    newProjects.splice(index, 1);
    setFormData({ ...formData, projects: newProjects });
    toast.info("Project removed.");
  };

  const handleAddProject = () => {
    const projects = formData.projects || [];
    if (projects.length > 0) {
      const last = projects[projects.length - 1];
      if (!last.title.trim() && !last.description.trim() && !last.technologies.trim() && !last.link.trim()) {
        toast.warn("Please fill the last project before adding a new one.");
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      projects: [...projects, { title: '', description: '', technologies: '', link: '' }]
    }));
    toast.success("New project added.");
  };

  const handleExperienceChange = (index, e) => {
    const { name, value } = e.target;
    const newExperience = [...(formData.experience || [])];
    newExperience[index] = { ...newExperience[index], [name]: value };
    setFormData({ ...formData, experience: newExperience });
  };

  const handleDeleteExperience = (index) => {
    const newExperience = [...(formData.experience || [])];
    newExperience.splice(index, 1);
    setFormData({ ...formData, experience: newExperience });
    toast.info("Experience entry removed.");
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...(prev.experience || []), { jobTitle: '', company: '', duration: '', responsibilities: [] }]
    }));
    toast.success("New experience entry added.");
  };

  const handleResponsibilitiesChange = (index, e) => {
    const newExperience = [...(formData.experience || [])];
    newExperience[index] = {
      ...newExperience[index],
      responsibilities: e.target.value.split("\n"),
    };
    setFormData({ ...formData, experience: newExperience });
  };

  const handleEducationChange = (index, e) => {
    const { name, value } = e.target;
    const newEducation = [...(formData.education || [])];
    newEducation[index] = { ...newEducation[index], [name]: value };
    setFormData({ ...formData, education: newEducation });
  };

  const handleDeleteEducation = (index) => {
    const newEducation = [...(formData.education || [])];
    newEducation.splice(index, 1);
    setFormData({ ...formData, education: newEducation });
    toast.info("Education entry removed.");
  };

  const handleAddEducation = () => {
    setFormData(prev => ({ ...prev, education: [...(prev.education || []), { university: '', degree: '', duration: '', details: '' }] }));
    toast.success("New education entry added.");
  };

  const handleAchievementChange = (index, e) => {
    const { name, value } = e.target;
    const newAchievements = [...(formData.achievements || [])].map((ach, i) => 
      i === index ? { ...ach, [name]: value } : ach
    );
    setFormData({ ...formData, achievements: newAchievements });
  };

  const handleDeleteAchievement = (index) => {
    const newAchievements = [...(formData.achievements || [])];
    newAchievements.splice(index, 1);
    setFormData({ ...formData, achievements: newAchievements });
    toast.info("Testimonial removed.");
  };

  const handleAddAchievement = () => {
    const currentAchievements = formData.achievements || [];
    const lastAchievement = currentAchievements[currentAchievements.length - 1];
    if (lastAchievement && !lastAchievement.quote.trim()) {
      toast.warn("Please fill the last testimonial before adding a new one.");
      return;
    }
    setFormData(prev => ({ ...prev, achievements: [...currentAchievements, { quote: '' }] }));
    toast.success("New testimonial added.");
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
        github: data.github || prev.github, // Add this line to handle the github URL
        careerObjective: data.careerObjective || prev.careerObjective,
        skills: Array.isArray(data.skills)
          ? data.skills.join(", ")
          : data.skills || prev.skills,
        projects: Array.isArray(data.projects) ? data.projects : prev.projects,
        experience: Array.isArray(data.experience)
          ? data.experience
          : prev.experience,
        // Convert the array of strings for achievements into an array of objects
        achievements: Array.isArray(data.achievements) && data.achievements.length > 0
          ? data.achievements.filter(quote => quote && quote.trim()).map(quote => ({ quote }))
          : prev.achievements,
        education: Array.isArray(data.education) && data.education.length > 0
          ? data.education
          : prev.education,
      }));
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: err.message || "Failed to parse resume.", type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsParsingResume(false);
      setGlobalLoading(false);
      // if (toast.isActive(toastId) && toast.isLoading(toastId)) {
      //   toast.dismiss(toastId);
      // }
      toast.dismiss(toastId);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (file) await uploadResume(file);
  };

  const handleFetchRepos = async () => {
    const githubInput = formData.github;
    if (!githubInput) {
      toast.info("Please enter your GitHub username or profile URL first.");
      return;
    }

    let username;
    // Try to extract username from URL, otherwise assume the input is the username
    const urlMatch = githubInput.match(/github\.com\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      username = urlMatch[1];
    } else if (!githubInput.includes('/') && !githubInput.includes('.')) {
      username = githubInput;
    } else {
      toast.error("Invalid input. Please enter just your username or a full GitHub URL.");
      return;
    }

    setIsFetchingRepos(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/repos/${username}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch repos.`);
      }
      const repos = await response.json();
      setFetchedRepos(repos);
      toast.success(`Found ${repos.length} of your most recent public repositories!`);
      // Scroll to the new section after it renders
      setTimeout(() => {
        reposContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error("Error fetching repos:", error);
      toast.error(error.message);
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const addRepoToProjects = (repo) => {
    // Add repo to projects, avoiding duplicates
    if (!formData.projects.some(p => p.title === repo.title)) {
      setFormData(prev => ({ ...prev, projects: [...prev.projects, repo] }));
      toast.info(`Added "${repo.title}" to your projects.`);
    } else {
      toast.warn(`Project "${repo.title}" is already in your list.`);
    }
  };


  // Enhance All with AI
 const enhanceAllWithAI = async () => {
  setEnhancing(true);
  setGlobalLoading(true);
  setGloballyEnhancedData(null);

  try {
    // ❌ REMOVE IMAGE BEFORE SENDING
    const { image, ...safeFormData } = formData;

    const resp = await fetch(`${API_BASE_URL}/api/enhance-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: safeFormData }),
    });

    if (!resp.ok) throw new Error("Failed to get AI enhancement.");

    const data = await resp.json();
    setGloballyEnhancedData(data.enhancedData);

    toast.success("AI suggestions ready 🚀");

    setTimeout(() => {
      suggestionsContainerRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);

  } catch (err) {
    console.error(err);
    toast.error("AI enhancement failed");
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
  const AISuggestion = ({ field, value }) => {
  const accept = () => {
    if (field.includes("projects")) {
      const [_, index, key] = field.split(".");
      const updated = [...formData.projects];
      updated[index][key] = value;
      setFormData({ ...formData, projects: updated });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    toast.success("Updated");
  };

  return (
    <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
      <p className="text-yellow-400 text-sm mb-1">AI Suggestion</p>
      <p className="text-gray-300 text-sm mb-2">{value}</p>

      <div className="flex gap-2">
        <button onClick={accept} className="px-3 py-1 bg-green-500 text-black rounded">
          Accept
        </button>
        <button className="px-3 py-1 border border-white/20 rounded">
          Reject
        </button>
      </div>
    </div>
  );
};
return (
  <div className="space-y-8 text-white">

    {/* AI BUTTON */}
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
      <button
        onClick={enhanceAllWithAI}
        className="px-6 py-3 bg-green-500 text-black rounded-lg hover:bg-green-400"
        disabled={enhancing}
      >
        {enhancing ? "Enhancing..." : "✨ Enhance with AI"}
      </button>
    </div>

    {/* PERSONAL DETAILS */}
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">Personal Details</h3>

      <input type="file" ref={fileInputRef} onChange={handleResumeChange} className="hidden" />

      <button
        onClick={() => fileInputRef.current.click()}
        className="mb-4 px-5 py-2 bg-green-500 text-black rounded-lg"
      >
        {isParsingResume ? "Parsing..." : "📄 Upload Resume"}
      </button>
{/* PROFILE IMAGE */}
<div className="mt-4">
  <label className="block text-sm text-gray-400 mb-2">
    Profile Image
  </label>

  <input
    type="file"
    onChange={handleImageChange}
    accept="image/*"
    className="input-dark"
  />

  {formData.image && (
    <img
      src={formData.image}
      alt="preview"
      className="mt-4 w-24 h-24 rounded-full object-cover border border-white/20"
    />
  )}
</div>
      <div className="space-y-4">

        <input name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Full Name" className="input-dark" />

        {globallyEnhancedData?.fullName && (
          <AISuggestion field="fullName" value={globallyEnhancedData.fullName} />
        )}

        <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="input-dark" />

        <input name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="Phone" className="input-dark" />

        <input name="portfolioLink" value={formData.portfolioLink || ''} onChange={handleInputChange} placeholder="Portfolio URL" className="input-dark" />

        <input name="linkedin" value={formData.linkedin} onChange={handleInputChange} placeholder="LinkedIn" className="input-dark" />

        <div className="flex gap-2">
          <input name="github" value={formData.github} onChange={handleInputChange} placeholder="GitHub" className="input-dark flex-1" />
          <button onClick={handleFetchRepos} className="px-4 bg-white/10 rounded-lg hover:bg-white/20">
            Fetch
          </button>
        </div>

        <input name="headline" value={formData.headline} onChange={handleInputChange} placeholder="Headline" className="input-dark" />

        {globallyEnhancedData?.headline && (
          <AISuggestion field="headline" value={globallyEnhancedData.headline} />
        )}

      </div>
    </div>
{/* 🔥 GITHUB REPOS DISPLAY */}
{fetchedRepos.length > 0 && (
  <div
    ref={reposContainerRef}
    className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl"
  >
    <h4 className="text-lg font-semibold mb-3">
      Select Projects from GitHub
    </h4>

    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
      {fetchedRepos.map((repo, index) => (
        <div
          key={index}
          className="flex justify-between items-center p-3 bg-black/30 rounded border border-white/10"
        >
          <div>
            <p className="font-semibold text-white">
              {repo.title}
            </p>
            <p className="text-sm text-gray-400">
              {repo.description}
            </p>
          </div>

          <button
            onClick={() => addRepoToProjects(repo)}
            className="px-3 py-1 bg-green-500 text-black rounded hover:bg-green-400"
          >
            + Add
          </button>
        </div>
      ))}
    </div>
  </div>
)}
    {/* SUMMARY */}
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">Professional Summary</h3>

      <textarea
        name="careerObjective"
        value={formData.careerObjective}
        onChange={handleInputChange}
        className="input-dark h-28"
        placeholder="Write summary..."
      />

      {globallyEnhancedData?.careerObjective && (
        <AISuggestion field="careerObjective" value={globallyEnhancedData.careerObjective} />
      )}
    </div>

    {/* SKILLS */}
<div className="p-6 bg-white/5 border border-white/10 rounded-xl">
  <h3 className="text-xl font-semibold mb-4">Skills</h3>

  {/* Add Skill */}
  <div className="flex gap-2 mb-3">
    <input
      value={newSkill}
      onChange={(e) => setNewSkill(e.target.value)}
      className="input-dark flex-1"
      placeholder="Add skill"
    />
    <button
      onClick={handleAddSkill}
      className="px-4 bg-green-500 text-black rounded-lg hover:bg-green-400 transition"
    >
      Add
    </button>
  </div>

  {/* Existing Skills */}
  <div className="space-y-2">
    {skillsArray.map((s, i) => (
      <div key={i} className="flex justify-between bg-white/5 p-2 rounded">
        <span>{s}</span>
        <button
          onClick={() => handleRemoveSkill(i)}
          className="text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>
    ))}
  </div>

  {/* 🔥 AI SUGGESTION */}
  {globallyEnhancedData?.skills && globallyEnhancedData.skills.length > 0 && (
    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">

      <p className="text-yellow-400 text-sm mb-2">
        AI Suggested Skills
      </p>

      {/* Suggested Skills List */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* {globallyEnhancedData.skills.map((skill, i) => (
          <span
            key={i}
            className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300"
          >
            {skill}
          </span>
        ))} */}
        {Array.isArray(globallyEnhancedData?.skills)
  ? globallyEnhancedData.skills.map((skill, i) => (
      <span key={i}>{skill}</span>
    ))
  : typeof globallyEnhancedData?.skills === "string"
  ? globallyEnhancedData.skills.split(",").map((skill, i) => (
      <span key={i}>{skill.trim()}</span>
    ))
  : null}
      </div>

      {/* Actions */}
      <div className="flex gap-3">

        <button
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              // skills: globallyEnhancedData.skills
              skills: Array.isArray(globallyEnhancedData.skills)
  ? globallyEnhancedData.skills
  : globallyEnhancedData.skills.split(",").map(s => s.trim())
            }));
            toast.success("Skills updated with AI suggestions");
          }}
          className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition"
        >
          Accept
        </button>

        <button
          onClick={() => toast.info("Kept existing skills")}
          className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition"
        >
          Reject
        </button>

      </div>
    </div>
  )}
</div>
{/* EDUCATION */}
<div className="p-6 bg-white/5 border border-white/10 rounded-xl">
  <h3 className="text-xl font-semibold mb-4">Education</h3>

  {formData.education?.map((edu, i) => (
    <div key={i} className="mb-4 p-4 bg-black/30 rounded">

      <input
        name="university"
        value={edu.university || ""}
        onChange={(e) => handleEducationChange(i, e)}
        placeholder="University"
        className="input-dark mb-2"
      />

      <input
        name="degree"
        value={edu.degree || ""}
        onChange={(e) => handleEducationChange(i, e)}
        placeholder="Degree"
        className="input-dark mb-2"
      />

      <input
        name="duration"
        value={edu.duration || ""}
        onChange={(e) => handleEducationChange(i, e)}
        placeholder="Duration"
        className="input-dark mb-2"
      />

      <textarea
        name="details"
        value={edu.details || ""}
        onChange={(e) => handleEducationChange(i, e)}
        placeholder="Details"
        className="input-dark h-20"
      />

      <button
        onClick={() => handleDeleteEducation(i)}
        className="text-red-400 mt-2"
      >
        Delete
      </button>

    </div>
  ))}

  <button
    onClick={handleAddEducation}
    className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
  >
    + Add Education
  </button>
</div>
    {/* PROJECTS */}
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">Projects</h3>

      {formData.projects?.map((p, i) => (
        <div key={i} className="mb-4 p-4 bg-black/30 rounded">

          <input name="title" value={p.title || ''} onChange={(e) => handleProjectChange(i, e)} className="input-dark mb-2" placeholder="Title" />

          <input name="description" value={p.description || ''} onChange={(e) => handleProjectChange(i, e)} className="input-dark mb-2" placeholder="Description" />

          {globallyEnhancedData?.projects?.[i]?.description && (
            <AISuggestion field={`projects.${i}.description`} value={globallyEnhancedData.projects[i].description} />
          )}

          <input name="technologies" value={p.technologies || ''} onChange={(e) => handleProjectChange(i, e)} className="input-dark mb-2" placeholder="Technologies" />

          <input name="link" value={p.link || ''} onChange={(e) => handleProjectChange(i, e)} className="input-dark" placeholder="Link" />

          <button onClick={() => handleDeleteProject(i)} className="text-red-400 mt-2">Delete</button>

        </div>
      ))}

      <button onClick={handleAddProject} className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">
        + Add Project
      </button>
    </div>
{/* EXPERIENCE */}
<div className="p-6 bg-white/5 border border-white/10 rounded-xl">
  <h3 className="text-xl font-semibold mb-4">Experience</h3>

  {Array.isArray(formData.experience) &&
    formData.experience.map((exp, i) => (
      <div key={i} className="mb-4 p-4 bg-black/30 rounded">

        <input
          name="jobTitle"
          value={exp.jobTitle || ""}
          onChange={(e) => handleExperienceChange(i, e)}
          placeholder="Job Title"
          className="input-dark mb-2"
        />

        <input
          name="company"
          value={exp.company || ""}
          onChange={(e) => handleExperienceChange(i, e)}
          placeholder="Company"
          className="input-dark mb-2"
        />

        <input
          name="duration"
          value={exp.duration || ""}
          onChange={(e) => handleExperienceChange(i, e)}
          placeholder="Duration"
          className="input-dark mb-2"
        />

        <textarea
          value={(exp.responsibilities || []).join("\n")}
          onChange={(e) => handleResponsibilitiesChange(i, e)}
          placeholder="Responsibilities (one per line)"
          className="input-dark h-24"
        />

        {/* 🔥 AI SUGGESTION */}
        {globallyEnhancedData?.experience?.[i] && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">

            <p className="text-yellow-400 text-sm mb-2">
              AI Suggestion
            </p>

            <p className="text-gray-300 text-sm">
              <strong>Role:</strong> {globallyEnhancedData.experience[i].jobTitle}
            </p>

            <p className="text-gray-300 text-sm">
              <strong>Company:</strong> {globallyEnhancedData.experience[i].company}
            </p>

            <p className="text-gray-300 text-sm">
              <strong>Duration:</strong> {globallyEnhancedData.experience[i].duration}
            </p>

            <p className="text-gray-300 text-sm mb-2">
              <strong>Responsibilities:</strong><br />
              {(globallyEnhancedData.experience[i].responsibilities || []).join(", ")}
            </p>

            <div className="flex gap-2">

              <button
                onClick={() => {
                  const updated = [...formData.experience];
                  updated[i] = globallyEnhancedData.experience[i];
                  setFormData({ ...formData, experience: updated });
                  toast.success("Experience updated");
                }}
                className="px-3 py-1 bg-green-500 text-black rounded"
              >
                Accept
              </button>

              <button
                onClick={() => toast.info("Kept existing experience")}
                className="px-3 py-1 border border-white/20 rounded"
              >
                Reject
              </button>

            </div>
          </div>
        )}

        <button
          onClick={() => handleDeleteExperience(i)}
          className="text-red-400 mt-2"
        >
          Delete
        </button>

      </div>
    ))}

  <button
    onClick={handleAddExperience}
    className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
  >
    + Add Experience
  </button>
</div>
{/* ACHIEVEMENTS */}
<div className="p-6 bg-white/5 border border-white/10 rounded-xl">
  <h3 className="text-xl font-semibold mb-4">Achievements</h3>

  {formData.achievements?.map((a, i) => (
    <div key={i} className="mb-4">

      <textarea
        name="quote"
        value={a.quote || ""}
        onChange={(e) => handleAchievementChange(i, e)}
        placeholder="Achievement"
        className="input-dark h-20"
      />

      <button
        onClick={() => handleDeleteAchievement(i)}
        className="text-red-400 mt-2"
      >
        Delete
      </button>

    </div>
  ))}

  <button
    onClick={handleAddAchievement}
    className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
  >
    + Add Achievement
  </button>
</div>
  </div>
  
  
);
};

export default FormInputs;
