import { UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Deployment() {
  const navigate = useNavigate();
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
