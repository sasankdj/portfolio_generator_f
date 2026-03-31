import { UploadCloud, Loader, ExternalLink, Link } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePortfolio } from '../components/PortfolioContext';
import { useAuth } from '../components/AuthContext';
import { useState, useEffect } from 'react';
import { useVercelDeploy } from '../hooks/useVercelDeploy';
import { toast } from 'react-toastify';
import { useNetlifyDeploy } from '../hooks/useNetlifyDeploy';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Deployment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userDetails } = usePortfolio();
  const [deployZip, setDeployZip] = useState(null);
  const [isVercelConnected, setIsVercelConnected] = useState(false);
  const [isNetlifyConnected, setIsNetlifyConnected] = useState(false);
  // const { isDeploying: isVercelDeploying, deployedUrl: vercelDeployedUrl, handleVercelDeploy } = useVercelDeploy();
  const { isDeploying: isNetlifyDeploying, deployedUrl: netlifyDeployedUrl, handleNetlifyDeploy } = useNetlifyDeploy();

  useEffect(() => {

    if (!user || !user.token) {
      return;
    }

    const checkConnections = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/connections`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });
        if (response.ok) {
          const { isVercelConnected, isNetlifyConnected } = await response.json();
          setIsVercelConnected(isVercelConnected);
          setIsNetlifyConnected(isNetlifyConnected);
        } else if (response.status === 401) {
          // Handle unauthorized access, e.g., by logging out the user
          console.error('Unauthorized access checking connections. Token might be invalid.');
        }
      } catch (error) {
        console.error('Error checking deployment connections:', error);
      }
    };

    checkConnections();
  }, [user, user?.token]);

  // const handleConnectVercel = async () => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/auth/vercel/init`, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${user.token}`,
  //       },
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.authUrl) {
  //         window.location.href = data.authUrl;
  //       }
  //     } else if (response.status === 401) {
  //       console.error('Unauthorized: Could not initiate Vercel connection.');
  //       // Optionally, redirect to login or show a toast message
  //     }
  //   } catch (error) {
  //     console.error('Error initiating Vercel OAuth:', error);
  //   }
  // };

  const handleNetlifyManualDeploy = async () => {
    if (!deployZip) {
      toast.error("Please select a portfolio zip file to deploy.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('zipFile', deployZip);

      const response = await fetch(`${API_BASE_URL}/api/deploy/netlify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deploy to Netlify.');
      }

      const deployData = await response.json();
      toast.success(`Successfully deployed to Netlify! Your site is available at ${deployData.url}`);

    } catch (error) {
      console.error("Error deploying to Netlify:", error);
      toast.error(`Failed to deploy to Netlify: ${error.message}`);
    }
  };



  // const handleDeployClick = () => {
  //   if (!isVercelConnected) {
  //     handleConnectVercel();
  //   } else {
  //     handleVercelDeploy(userDetails.template);
  //   }
  // };

  const handleConnectNetlify = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/netlify/init`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else if (response.status === 401) {
        console.error('Unauthorized: Could not initiate Netlify connection.');
        // Optionally, redirect to login or show a toast message
      }
    } catch (error) {
      console.error('Error initiating Netlify OAuth:', error);
    }
  };

  const handleNetlifyDeployClick = () => {
    if (!isNetlifyConnected) {
      handleConnectNetlify();
    } else {
      handleNetlifyDeploy(userDetails.template);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

return (
  <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">

    {/* 🔥 GLOBAL GLOW */}
    <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
    <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

    <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
        <div className="mb-4 lg:mb-0">
          <h2 className="text-4xl font-bold mb-2">
            Deploy Your <span className="text-green-400">Portfolio</span>
          </h2>
          <p className="text-gray-400 max-w-2xl">
            Launch your portfolio online instantly with one click 🚀
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
          >
            ← Back
          </button>

          <button
            onClick={() => navigate('/form')}
            className="px-6 py-2 bg-green-500 text-black rounded-lg font-medium hover:bg-green-400"
          >
            Edit Portfolio
          </button>
        </div>
      </div>

      {/* ONE CLICK DEPLOY */}
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg mb-10">

        <h3 className="text-2xl font-semibold mb-6">
          One-Click Deployment
        </h3>

        <div className="grid md:grid-cols-2 gap-6">

          {/* NETLIFY */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:shadow-green-500/20 transition">

            <div className="flex items-center gap-3 mb-4">
              <UploadCloud className="text-green-400" />
              <h4 className="text-lg font-semibold">Netlify</h4>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              Deploy your portfolio instantly with one click.
            </p>

            {!isNetlifyConnected && (
              <button
                onClick={handleConnectNetlify}
                className="w-full mb-3 px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 flex items-center justify-center gap-2"
              >
                <Link size={16} /> Connect Account
              </button>
            )}

            <button
              onClick={handleNetlifyDeployClick}
              disabled={isNetlifyDeploying || !isNetlifyConnected}
              className="w-full px-6 py-3 bg-green-500 text-black rounded-lg font-medium hover:bg-green-400 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isNetlifyDeploying ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}
              {isNetlifyDeploying
                ? "Deploying..."
                : "Deploy"}
            </button>

            {netlifyDeployedUrl && (
              <div className="mt-4 text-sm">
                <p className="text-green-400 mb-1">🚀 Live URL</p>
                <a
                  href={netlifyDeployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all flex items-center gap-2 hover:underline text-gray-300"
                >
                  {netlifyDeployedUrl} <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MANUAL DEPLOY */}
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg">

        <h3 className="text-2xl font-semibold mb-6">
          Manual Deployment
        </h3>

        <div className="max-w-xl">

          <ol className="space-y-4 text-gray-400 text-sm mb-6">
            <li>1. Download your portfolio ZIP</li>
            <li>2. Go to Netlify</li>
            <li>3. Drag & drop ZIP file</li>
            <li>4. Your site goes live instantly 🚀</li>
          </ol>

          <div className="flex flex-col gap-3">

            <input
              type="file"
              accept=".zip"
              onChange={(e) => setDeployZip(e.target.files[0])}
              className="text-sm"
            />

            <button
              onClick={handleNetlifyManualDeploy}
              disabled={!deployZip}
              className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 disabled:opacity-40"
            >
              Upload & Deploy
            </button>

          </div>

        </div>
      </div>

    </main>

    

  </div>
);
}
