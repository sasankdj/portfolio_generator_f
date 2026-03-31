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
  <div className="min-h-screen bg-[#0a0a0a] font-sans relative overflow-hidden">

    {/* Glow background */}
    <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
    <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

    {/* HERO */}
    <section className="mx-6 md:mx-12 mt-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-12 text-center">

      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        Welcome, {user?.name || "User"} 🚀
      </h1>

      <p className="text-xl text-gray-400 mb-8">
        Build your professional portfolio in minutes.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate("/templates")}
          className="px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        >
          Create Portfolio
        </button>

        <button
          onClick={() => navigate("/form")}
          className="px-8 py-4 border border-white/20 text-white rounded-lg hover:bg-white/10 transition"
        >
          Create Resume
        </button>
      </div>
    </section>

    {/* DASHBOARD */}
    <section className="max-w-7xl mx-auto mt-16 px-6 md:px-12 grid lg:grid-cols-3 gap-8">

      {/* LEFT */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">

        <h3 className="text-2xl font-bold text-white mb-6">
          Get Started
        </h3>

        <div className="space-y-4">

          {/* Manual */}
          <div className="flex items-center p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="mr-4 text-green-400 font-bold">AI</div>
            <div>
              <h4 className="text-white font-semibold">No Resume?</h4>
              <p className="text-gray-400 text-sm">Fill details manually</p>
            </div>
            <button onClick={() => navigate('/form')} className="ml-auto text-green-400">
              Start
            </button>
          </div>

          {/* Upload */}
          <div className="flex items-center p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="mr-4 text-yellow-400 font-bold">M</div>
            <div>
              <h4 className="text-white font-semibold">Have Resume?</h4>
              <p className="text-gray-400 text-sm">Upload & auto-fill</p>
            </div>
            <button onClick={() => navigate('/form')} className="ml-auto text-yellow-400">
              Upload
            </button>
          </div>

          {/* GitHub */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center mb-2">
              <Github size={20} className="mr-2 text-white" />
              <h4 className="text-white font-semibold">Add GitHub</h4>
            </div>

            <input
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="GitHub username or link"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white mb-2"
            />

            <button
              onClick={handleGithubSubmit}
              className="w-full py-2 bg-green-500 text-black rounded-md hover:bg-green-400"
            >
              Add to Form
            </button>
          </div>

          {/* Edit */}
          <div className="flex items-center p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <h4 className="text-white font-semibold">Edit Details</h4>
              <p className="text-gray-400 text-sm">Update your info</p>
            </div>
            <button onClick={() => navigate('/form')} className="ml-auto text-white">
              Edit
            </button>
          </div>

          {/* Resume */}
          <div className="flex items-center p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <h4 className="text-white font-semibold">Create Resume</h4>
              <p className="text-gray-400 text-sm">Generate ATS resume</p>
            </div>
            <button onClick={() => navigate('/form')} className="ml-auto text-green-400">
              Create
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">

        <h3 className="text-2xl font-bold text-white mb-6">Actions</h3>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/templates')}
            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white"
          >
            🎨 Explore Templates
          </button>

          <button
            onClick={() => toast.info("Coming soon")}
            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white"
          >
            ⚙️ Settings
          </button>
        </div>

      </div>
    </section>

    {/* PORTFOLIO */}
    <section className="max-w-7xl mx-auto mt-8 px-6 md:px-12">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">

        <h3 className="text-2xl font-bold text-white mb-6">
          Your Portfolio
        </h3>

        {hasPortfolio ? (
          <>
            <p className="text-green-400 mb-4">Portfolio is live 🚀</p>

            <div className="flex flex-wrap justify-center gap-4">
              <a href={portfolioLink} target="_blank" className="px-6 py-3 bg-green-500 text-black rounded-lg">
                View
              </a>

              <button onClick={() => {navigator.clipboard.writeText(portfolioLink); toast.success("Copied");}}
                className="px-6 py-3 bg-white/10 text-white rounded-lg">
                Copy
              </button>

              <button onClick={() => navigate('/templates')}
                className="px-6 py-3 border border-white/20 text-white rounded-lg">
                Edit
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 mb-4">No portfolio yet</p>

            <button
              onClick={() => {
                if (!hasResume) {
                  toast.error("Upload resume first");
                  navigate('/upload');
                  return;
                }
                navigate('/templates');
              }}
              className="px-8 py-4 bg-green-500 text-black rounded-lg hover:bg-green-400"
            >
              Generate Portfolio
            </button>
          </>
        )}

      </div>
    </section>

    <Footer />
    <Chatbot />
  </div>
);
}
