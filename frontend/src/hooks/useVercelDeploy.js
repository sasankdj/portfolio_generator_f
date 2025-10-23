import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../components/AuthContext';
import { usePortfolio } from '../components/PortfolioContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useVercelDeploy = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const { user } = useAuth();
  const { userDetails } = usePortfolio();

  const handleVercelDeploy = async (template) => {
    if (!user) {
      toast.error('You must be logged in to deploy.');
      return;
    }
    if (!userDetails || !template) {
      toast.error('No portfolio data or template found. Please create a portfolio first.');
      return;
    }

    setIsDeploying(true);
    setDeployedUrl('');
    toast.info("Deployment to Vercel has started...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/deploy/vercel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ formData: userDetails, template }),
      });

      // Read the body as text first, as it could be JSON or HTML.
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = responseText;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (_) { /* Not JSON, use raw text. */ }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      toast.success(`Deployed successfully!`);
      setDeployedUrl(data.url);
    } catch (error) {
      console.error('Vercel deployment error:', error);
      toast.error(error.message || 'Failed to deploy to Vercel.');
    } finally {
      setIsDeploying(false);
    }
  };

  return { isDeploying, deployedUrl, handleVercelDeploy };
};