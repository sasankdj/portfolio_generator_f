import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function NetlifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        toast.error('Missing code or state in callback.');
        navigate('/deployment');
        return;
      }

      if (!user || !user.token) {
        toast.error('User not authenticated.');
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/netlify/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify({ code, state }),
        });

        if (response.ok) {
          toast.success('Netlify account connected successfully!');
          navigate('/deployment');
        } else {
          const errorData = await response.json();
          toast.error(errorData.msg || 'Failed to connect Netlify account.');
          navigate('/deployment');
        }
      } catch (error) {
        console.error('Netlify callback error:', error);
        toast.error('An error occurred while connecting Netlify.');
        navigate('/deployment');
      }
    };

    handleCallback();
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600 mx-auto"></div>
        <p className="mt-4 text-lg">Connecting your Netlify account...</p>
      </div>
    </div>
  );
}
