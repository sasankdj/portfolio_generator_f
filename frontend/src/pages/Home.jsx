import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { usePortfolio } from '../components/PortfolioContext';
import Footer from "../components/Footer";
import { useAuth } from '../components/AuthContext';
import Chatbot from '../components/Chatbot';
import { Github } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { hasResume, hasPortfolio, portfolioLink, userDetails, updateUserDetails } = usePortfolio();
  const { user } = useAuth();
  const [githubUsername, setGithubUsername] = useState('');

  const handleGithubSubmit = () => {
    if (!githubUsername.trim()) {
      toast.error("Please enter a GitHub username or link.");
      return;
    }
    // Extract username from URL if provided, otherwise use the input as is
    const usernameMatch = githubUsername.match(/github\.com\/([a-zA-Z0-9_-]+)/);
    const username = usernameMatch ? usernameMatch[1] : githubUsername.trim();

    updateUserDetails({ ...userDetails, github: `https://github.com/${username}` });
    navigate('/form');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-sans">
      {/* Hero Welcome Section */}
      <section className="relative mx-6 md:mx-12 mt-8 rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 p-12 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-black/20 to-black/30 rounded-3xl animate-fade-in"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg animate-slide-up">
            Welcome, {user?.name || 'User'}! <span className="inline-block animate-bounce">🚀</span>
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
            Ready to build your standout portfolio? Follow the steps below to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate('/templates')}
              className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105"
            >
              🌐 Create Portfolio Website
            </button>
            <button
              onClick={() => navigate('/form')}
              className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105"
            >
              📄 Create ATS Resume
            </button>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white bg-opacity-10 rounded-full animate-pulse delay-1000"></div>
      </section>

      {/* Dashboard Section */}
      <section className="max-w-7xl mx-auto mt-16 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Get Started Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">Get Started</h3>
          <div className="space-y-4">
            {/* Option 1: Upload Resume */}
            <div className="flex items-center p-4 rounded-xl transition-all duration-300 bg-indigo-50 border-indigo-200 border">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-indigo-500 text-white font-bold text-lg">
                AI
              </div>
              <div>
                <h4 className="text-lg font-semibold text-indigo-900">Dont have a resume?</h4>
                <p className="text-sm text-indigo-700">Fill the details manualy to get you started quickly.</p>
              </div>
              <button
                onClick={() => navigate('/form')}
                className="ml-auto px-4 py-2 bg-white rounded-lg font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors text-sm"
              >
                Fill details
              </button>
            </div>
            {/**/ }
             <div className="flex items-center p-4 rounded-xl transition-all duration-300 bg-indigo-50 border-indigo-200 border">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-indigo-400 text-white font-bold text-lg">
                M
              </div>
              <div>
                <h4 className="text-lg font-semibold text-indigo-900">Have a resume?</h4>
                <p className="text-sm text-indigo-700">Let our AI extract the details to get you started quickly.</p>
              </div>
              <button
                onClick={() => navigate('/form')}
                className="ml-auto px-4 py-2 bg-white rounded-lg font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors text-sm"
              >
                Upload Resume
              </button>
            </div>
            {/* GitHub Import */}
            <div className="flex items-center p-4 rounded-xl transition-all duration-300 bg-gray-800 border-gray-700 border text-white">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gray-600">
                <Github size={24} />
              </div>
              <div className="flex-grow">
                <h4 className="text-lg font-semibold">Add your GitHub</h4>
                <p className="text-sm text-gray-300">Enter your username to add a link to your portfolio.</p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="Enter GitHub Username or Link"
                    className="flex-grow px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  />
                  <button onClick={handleGithubSubmit} className="px-4 py-1.5 bg-indigo-500 rounded-md font-semibold hover:bg-indigo-600 transition-colors text-sm whitespace-nowrap">Add to Form</button>
                </div>
              </div>
            </div>
            {/* Option 2: Fill Manually */}
            <div className="flex items-center p-4 rounded-xl bg-gray-50 border-gray-200 border">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gray-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Review & Refine Details</h4>
                <p className="text-sm text-gray-600">Manually add or edit your portfolio information.</p>
              </div>
              <button onClick={() => navigate('/form')} className="ml-auto px-4 py-2 bg-white rounded-lg font-semibold text-gray-600 shadow-sm hover:bg-gray-100 transition-colors text-sm">
                Edit Details
              </button>
            </div>
            {/* Option 3: Create Resume */}
            <div className="flex items-center p-4 rounded-xl bg-teal-50 border-teal-200 border">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-teal-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-teal-800">Create Your Resume</h4>
                <p className="text-sm text-teal-600">Generate a professional resume from your profile.</p>
              </div>
              <button onClick={() => navigate('/form')} className="ml-auto px-4 py-2 bg-white rounded-lg font-semibold text-teal-600 shadow-sm hover:bg-teal-100 transition-colors text-sm">
                Create Resume
              </button>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-gray-100 flex flex-col">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">
            Actions
          </h3>
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            <button
              className="w-full text-left flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800 font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors duration-300"
              onClick={() => navigate('/templates')}
            >
              🎨 Explore Templates
            </button>
            
            <button
              className="w-full text-left flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800 font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors duration-300"
              onClick={() => {
                toast.info('App Settings coming soon!');
              }}
            >
              ⚙️ App Settings
            </button>
          </div>
        </div>
      </section>

      {/* Portfolio Status Section */}
      <section className="max-w-7xl mx-auto mt-8 px-6 md:px-12">
        <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Your Portfolio
          </h3>
          {hasPortfolio ? (
            <div className="text-center">
              <p className="text-lg text-green-700 mb-4">Your portfolio is ready! You can view, share, or edit it.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href={portfolioLink} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-md">
                  👀 View Live
                </a>
                <button onClick={() => { navigator.clipboard.writeText(portfolioLink); toast.success('Link copied!'); }} className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-md">
                  🔗 Copy Link
                </button>
                <button onClick={() => navigate('/templates')} className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-md">
                  ✏️ Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg text-gray-600 mb-4">You haven't created a portfolio yet. Complete the steps above, then generate it.</p>
              <button
                onClick={() => {
                  if (!hasResume) {
                    toast.error('Please upload your resume first.');
                    navigate('/upload');
                    return;
                  }
                  navigate('/templates');
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
              >
                ✨ Generate Portfolio
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <Chatbot />
    </div>
  );
}
