import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../components/AuthContext';
import { usePortfolio } from '../components/PortfolioContext';
import JSZip from 'jszip';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useNetlifyDeploy = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const { user } = useAuth();
  const { userDetails } = usePortfolio();

  const handleNetlifyDeploy = async (template) => {
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
    toast.info("Deployment to Netlify has started...");

    // 1. Generate the HTML for the portfolio
    try {
      const htmlResponse = await fetch(`${API_BASE_URL}/generate-portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: userDetails, template }),
      });

      if (!htmlResponse.ok) throw new Error('Failed to generate portfolio HTML.');
      const { html } = await htmlResponse.json();

      // 2. Create a ZIP file in memory
      const zip = new JSZip();
      zip.file('index.html', html);
      // Add _headers file to ensure correct Content-Type
      zip.file('_headers', '/index.html\n  Content-Type: text/html\n');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // 3. Create FormData and append the ZIP file
      const formData = new FormData();
      formData.append('zipFile', zipBlob, 'portfolio.zip');

      // 4. Send the FormData to the backend
      const response = await fetch(`${API_BASE_URL}/api/deploy/netlify`, {
        method: 'POST',
        headers: {
          // 'Content-Type' is set automatically by the browser for FormData
          'Authorization': `Bearer ${user?.token}`,
        },
        body: formData,
      });

      // Read the body as text first, as it could be JSON or HTML.
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = responseText;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch { /* Not JSON, use raw text. */ }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      toast.success(`Deployed successfully!`);
      setDeployedUrl(data.url);
    } catch (error) {
      console.error('Netlify deployment error:', error);
      toast.error(error.message || 'Failed to deploy to Netlify.');
    } finally {
      setIsDeploying(false);
    }
  };

  return { isDeploying, deployedUrl, handleNetlifyDeploy };
};
