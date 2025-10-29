import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import JSZip from 'jszip';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const usePortfolio = () => {
  return useContext(PortfolioContext);
};

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState({
    fullName: '',
    headline: '',
    email: '',
    linkedin: '',
    github: '',
    image: null,
    skills: '',
    careerObjective: '',
    projects: [{ title: '', description: '', technologies: '', link: '' }],
    experience: [{ company: '', jobTitle: '', duration: '', responsibilities: [] }],
    achievements: [{ quote: '' }],
    education: [{ university: '', degree: '', duration: '', details: '' }],
    template: 'classic'
  });

  const [resume, setResume] = useState(null);
  const [hasResume] = useState(false);
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [portfolioLink, setPortfolioLink] = useState('');
  const [githubConnected, setGithubConnected] = useState(false);
  const [netlifyConnected, setNetlifyConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [netlifyUsername, setNetlifyUsername] = useState('');

  const updateUserDetails = (details) => {
    // This function will now only update the state, not localStorage.
    setUserDetails(details);
  };

  const fetchUserDetails = async (userData) => {
    const token = userData?.token;
    if (!token) return;
    setLoading(true);
    try {
      // The backend identifies the user via the token, so no userId is needed in the URL
      const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        console.log("No portfolio data found for this user. Starting fresh.");
        // No data found, which is fine for a new user. The form will be empty.
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data.');
      }

      const data = await response.json();

      // Normalize achievements to array of objects
      if (data.achievements) {
        if (typeof data.achievements === 'string') {
          data.achievements = [{ quote: data.achievements }];
        } else if (Array.isArray(data.achievements) && data.achievements.length > 0) {
          data.achievements = data.achievements.map(item =>
            typeof item === 'string' ? { quote: item } : item
          ).filter(item => item.quote && item.quote.trim());
        }
      }

      // Also normalize education
      if (data.education && Array.isArray(data.education)) {
        data.education = data.education.map(edu => ({
            university: edu.university || '',
            degree: edu.degree || '',
            duration: edu.duration || '',
            details: edu.details || ''
        }));
      }

      updateUserDetails(data); // This updates both state and localStorage
      toast.info('Your saved portfolio details have been loaded.');
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Could not load your saved details.');
    } finally {
      setLoading(false);
    }
  };

  const saveUserDetails = async (detailsToSave) => {
    const token = user?.token; // The token is directly on the user object
    if (!token) {
      toast.warn('You must be logged in to save your details.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/portfolio`, { // Corrected endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // The backend can get the userId from the token, but sending it is also fine.
        body: JSON.stringify(detailsToSave), // The backend gets the user from the token, no need to send userId
      });

      if (!response.ok) {
        throw new Error('Failed to save portfolio data.');
      }

      toast.success('Your portfolio details have been saved!');
    } catch (error) {
      console.error('Error saving user details:', error);
      toast.error('Could not save your details to the server.');
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (file) => {
    setResume(file);

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Backend failed to parse resume.');
      }

      const parsedDetails = await response.json();
      updateUserDetails(prevDetails => ({ ...prevDetails, ...parsedDetails }));
      toast.success('Resume uploaded and parsed successfully! Check the form for extracted details.');
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast.error('Resume uploaded, but parsing failed. Please fill details manually.');
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = () => {
    setHasPortfolio(true);
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const setPortfolioURL = (url) => {
    setPortfolioLink(url);
  };

  const connectGithub = (username) => {
    setGithubConnected(true);
    setGithubUsername(username);
  };

  const connectNetlify = (username) => {
    setNetlifyConnected(true);
    setNetlifyUsername(username);
  };

  const downloadPortfolioHtml = async (template, details) => {
    if (!template) {
      toast.error("Please select a template first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: details, template }),
      });

      if (!response.ok) throw new Error('Failed to generate HTML.');

      const data = await response.json();
      if (!data.html) {
        throw new Error('No HTML returned from server');
      }

      const zip = new JSZip();
      zip.file('index.html', data.html);
      // Add _headers file to ensure correct Content-Type
      zip.file('_headers', '/index.html\n  Content-Type: text/html\n');

      zip.generateAsync({ type: 'blob' }).then(function (content) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'portfolio.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Portfolio downloaded successfully!");
      });
    } catch (error) {
      console.error('Error downloading portfolio:', error);
      toast.error(error.message || 'Could not download portfolio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortfolioContext.Provider value={{
      userDetails,
      updateUserDetails,
      resume,
      hasResume,
      uploadResume,
      setLoading, // Expose setLoading to be used by other components
      hasPortfolio,
      loading,
      createPortfolio,
      selectedTemplate,
      selectTemplate,
      portfolioLink,
      setPortfolioURL,
      githubConnected,
      netlifyConnected,
      githubUsername,
      netlifyUsername,
      connectGithub,
      connectNetlify,
      downloadPortfolioHtml,
      fetchUserDetails, // Add this
      saveUserDetails,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};
