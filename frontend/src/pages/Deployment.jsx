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
  const { isDeploying: isVercelDeploying, deployedUrl: vercelDeployedUrl, handleVercelDeploy } = useVercelDeploy();
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

  const handleConnectVercel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/vercel/init`, {
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
        console.error('Unauthorized: Could not initiate Vercel connection.');
        // Optionally, redirect to login or show a toast message
      }
    } catch (error) {
      console.error('Error initiating Vercel OAuth:', error);
    }
  };

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



  const handleDeployClick = () => {
    if (!isVercelConnected) {
      handleConnectVercel();
    } else {
      handleVercelDeploy(userDetails.template);
    }
  };

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #296B9A 0%, #99B5D0 100%)' }}>
     
     
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 text-white">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-3xl font-bold mb-2">Deploy Your Portfolio</h2>
            <p className="text-lg text-gray-200 max-w-2xl">
              Follow the simple steps below to host your generated portfolio on Netlify for free.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              ← Back
            </button>
            <button 
              onClick={() => navigate('/form')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              ✏️ Edit Portfolio
            </button>
          </div>
        </div>

       
        {/* One-Click Deployment */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">One-Click Deployment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vercel Instructions */}
            

            {/* Netlify Instructions */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-cyan-500 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <UploadCloud className="w-6 h-6 text-cyan-600" />
                <h4 className="text-xl font-semibold text-gray-800">Deploy with Netlify</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Instantly deploy your portfolio to Netlify with one click. No manual setup required.
              </p>
              {!isNetlifyConnected && (
                <button
                  onClick={handleConnectNetlify}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors mb-2"
                >
                  <Link size={20} /> Connect Netlify Account
                </button>
              )}
              <button
                onClick={handleNetlifyDeployClick}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
                disabled={isNetlifyDeploying || !isNetlifyConnected}
              >
                {isNetlifyDeploying ? <Loader size={20} className="animate-spin" /> : <UploadCloud size={20} />} {isNetlifyDeploying ? 'Deploying...' : (isNetlifyConnected ? 'Deploy to Netlify' : 'Connect Netlify First')}
              </button>
              {netlifyDeployedUrl && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-800">Your site is live!</p>
                  <a href={netlifyDeployedUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline break-all flex items-center justify-center gap-2">
                    {netlifyDeployedUrl} <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Deployment Instructions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How to Host Your Portfolio Manually</h3>
          <div className="flex justify-center">
            {/* Netlify Instructions */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-cyan-500 shadow-lg max-w-lg">
              <div className="flex items-center gap-3 mb-4">
                <UploadCloud className="w-6 h-6 text-cyan-600" />
                <h4 className="text-xl font-semibold text-gray-800">Deploy with Netlify</h4>
              </div>
              <ol className="list-decimal list-inside space-y-3 text-gray-600">
                <li>
                  <strong>Download Portfolio:</strong> Get the `portfolio.zip` file from the success page or the form page.
                </li>
                <li>
                  <strong>Sign Up & Deploy:</strong> Click the button below to go to Netlify. Sign up for a free account if you don't have one.
                  <a href="https://app.netlify.com/signup" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors">
                    <UploadCloud size={20} /> Go to Netlify to Deploy
                  </a>
                </li>
                 <input type="file" accept=".zip" onChange={(e) => setDeployZip(e.target.files[0])} />
                <button onClick={handleNetlifyManualDeploy} disabled={!deployZip}>
                  Deploy to Netlify</button>
                <li>
                  <strong>Drag & Drop:</strong> Log in to your Netlify dashboard. In the "Sites" section, you'll see an area to drag and drop your site. Simply drag and drop the downloaded `portfolio.zip` file into this area. Netlify will automatically unzip and deploy it.
                </li>
                <li>
                  <strong>Done!</strong> Netlify will instantly deploy your site and give you a live URL. You can customize the domain name in the site settings.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white font-bold text-xl">
            © 2025 Portfolio
          </div>
        </div>
      </footer>
    </div>
  );
}
