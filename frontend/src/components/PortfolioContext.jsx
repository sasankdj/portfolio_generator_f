import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
    skills: '',
    careerObjective: '',
    projects: [{ title: '', description: '' }, { title: '', description: '' }],
    experience: { company: '', jobTitle: '', duration: '', responsibilities: '' },
    achievements: ''
  });

  const [resume, setResume] = useState(null);
  const [hasResume, setHasResume] = useState(false);
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [portfolioLink, setPortfolioLink] = useState('');
  const [githubConnected, setGithubConnected] = useState(false);
  const [netlifyConnected, setNetlifyConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [netlifyUsername, setNetlifyUsername] = useState('');

  useEffect(() => {
    // Load from localStorage
    const savedDetails = localStorage.getItem('userDetails');
    if (savedDetails) setUserDetails(JSON.parse(savedDetails));

    const savedResume = localStorage.getItem('hasResume') === 'true';
    setHasResume(savedResume);

    const savedPortfolio = localStorage.getItem('hasPortfolio') === 'true';
    setHasPortfolio(savedPortfolio);

    const savedTemplate = localStorage.getItem('selectedTemplate');
    if (savedTemplate) setSelectedTemplate(savedTemplate);

    const savedLink = localStorage.getItem('portfolioLink');
    if (savedLink) setPortfolioLink(savedLink);

    const savedGithub = localStorage.getItem('githubConnected') === 'true';
    setGithubConnected(savedGithub);

    const savedNetlify = localStorage.getItem('netlifyConnected') === 'true';
    setNetlifyConnected(savedNetlify);

    const savedGithubUser = localStorage.getItem('githubUsername');
    if (savedGithubUser) setGithubUsername(savedGithubUser);

    const savedNetlifyUser = localStorage.getItem('netlifyUsername');
    if (savedNetlifyUser) setNetlifyUsername(savedNetlifyUser);
  }, []);

  const updateUserDetails = (details) => {
    if (typeof details === 'function') {
      setUserDetails(prevDetails => {
        const newDetails = details(prevDetails);
        localStorage.setItem('userDetails', JSON.stringify(newDetails));
        return newDetails;
      });
    } else {
      setUserDetails(details);
      localStorage.setItem('userDetails', JSON.stringify(details));
    }
  };

  const fetchUserDetails = async (token) => {
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
    if (!user || !user.id || !user.token) {
      toast.warn('You must be logged in to save your details.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        // The backend can get the userId from the token, but sending it is also fine.
        body: JSON.stringify({ userId: user.id, ...detailsToSave }),
      });

      if (!response.ok) {
        throw new Error('Failed to save portfolio data.');
      }

      toast.success('Your portfolio details have been saved!');
    } catch (error) {
      console.error('Error saving user details:', error);
      toast.error('Could not save your details. Your changes are saved locally.');
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (file) => {
    setResume(file);
    setHasResume(true);
    localStorage.setItem('hasResume', 'true');

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
    localStorage.setItem('hasPortfolio', 'true');
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    localStorage.setItem('selectedTemplate', template);
  };

  const setPortfolioURL = (url) => {
    setPortfolioLink(url);
    localStorage.setItem('portfolioLink', url);
  };

  const connectGithub = (username) => {
    setGithubConnected(true);
    setGithubUsername(username);
    localStorage.setItem('githubConnected', 'true');
    localStorage.setItem('githubUsername', username);
  };

  const connectNetlify = (username) => {
    setNetlifyConnected(true);
    setNetlifyUsername(username);
    localStorage.setItem('netlifyConnected', 'true');
    localStorage.setItem('netlifyUsername', username);
  };

  const downloadPortfolioHtml = async (template) => {
    if (!template) {
      toast.error("Please select a template first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/download-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: userDetails, template }),
      });

      if (!response.ok) throw new Error('Failed to generate HTML.');

      const htmlBlob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(htmlBlob);
      link.download = 'portfolio.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Portfolio HTML downloaded!");
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
      connectNetlify,      downloadPortfolioHtml,
      fetchUserDetails, // Add this
      saveUserDetails,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};
