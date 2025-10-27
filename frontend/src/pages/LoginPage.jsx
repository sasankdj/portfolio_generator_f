import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { usePortfolio } from "../components/PortfolioContext";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const { login, isLoggedIn } = useAuth();
  const { fetchUserDetails, userDetails, saveUserDetails } = usePortfolio();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    const handleGitHubCallback = async (authCode) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/github`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: authCode }),
        });
        const data = await response.json();
        if (response.ok && data.token) {
          const userData = { name: data.name, email: data.email, token: data.token, id: data.id };
          login(userData);
          await saveUserDetails({ email: data.email, fullName: data.name });
          if (location.state?.action === 'createPortfolio') {
            toast.success("Logged in! Now generating your portfolio...");
            navigate('/form', { state: { from: '/login', action: 'createPortfolio' }, replace: true });
          } else {
            fetchUserDetails(userData);
            navigate('/home', { replace: true });
          }
        } else {
          throw new Error(data.msg || 'GitHub login failed.');
        }
      } catch (error) {
        console.error('GitHub auth error:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      handleGitHubCallback(code);
    }
  }, []); // Intentionally empty to run only once on mount for the code check

  const handleSubmit = async (e) => {
     e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = { name: data.name, email: data.email, token: data.token, id: data.id };
        login(userData);
        await saveUserDetails({ email: data.email, fullName: data.name });

        // Check if we need to perform a post-login action
        if (location.state?.action === 'createPortfolio') {
          toast.success("Logged in! Now generating your portfolio...");
          navigate('/form', { state: { from: '/login', action: 'createPortfolio' }, replace: true });
        } else {
          await fetchUserDetails(userData);
          navigate('/home');
        }
      } else {
        setAuthError(data.msg || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      // Handle network errors or other unexpected errors
      console.error("Login failed", error);
      // Generic error message
      setAuthError("An unexpected error occurred. Please try again.");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setAuthError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });
        const data = await response.json();
        if (response.ok) {
          const userData = { name: data.name, email: data.email, token: data.token, id: data.id };
          login(userData);
          // After login, save the details that were in the form
          await saveUserDetails({ ...userDetails, email: data.email, name: data.name });

          // Check if we need to perform a post-login action
          if (location.state?.action === 'createPortfolio') {
            toast.success("Logged in! Now generating your portfolio...");
            navigate('/form', { state: { from: '/login', action: 'createPortfolio' }, replace: true });
          } else {
            await fetchUserDetails(userData);
            navigate('/home');
          }
        } else {
          setAuthError(data.msg || 'Google Sign-In failed.');
        }
      } catch (error) {
        console.error("Google Sign-In failed", error);
        setAuthError("An unexpected error occurred during Google Sign-In.");
      }
      setLoading(false);
    },
    onError: () => toast.error('Google sign-in failed. Please try again.'),
  });

  const handleGitHubSignIn = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    window.location.assign(`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&redirect_uri=${redirectUri}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 to-purple-300 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/20 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800">Log-in</h1>
          <div className="mt-2 text-gray-600">
            <p>Don't have an account?</p>
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white/50 placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white/50 placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="text-red-500 text-sm text-left">
              {authError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            Log in
          </button>
        </form>

        <div className="flex items-center text-gray-500 my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="px-4 text-sm">Or continue with</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {["Google", "GitHub"].map((provider) => {
            if (provider === "Google") {
              return (
                <button
                  key={provider}
                  onClick={() => handleGoogleSignIn()}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-black">{provider}</span>
                </button>
              );
            }
            return (
              <button
                key={provider}
                onClick={handleGitHubSignIn}
                className="flex-1 flex items-center justify-center py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-black">{provider}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
