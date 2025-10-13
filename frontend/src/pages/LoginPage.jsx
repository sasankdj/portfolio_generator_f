import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { usePortfolio } from "../components/PortfolioContext";
import { toast } from "react-toastify";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const { login, isLoggedIn } = useAuth();
  const { fetchUserDetails } = usePortfolio();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
     e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
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
        await fetchUserDetails(userData.token);
        navigate('/home');
      } else {
        // Specific error message from the backend
        setAuthError(data.msg || "Login failed. Please check your credentials.");
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
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,

          },
        }).then(r => r.json());
        const userInfo = await userInfoRes.json();
        // Note: Google Sign-In here won't have our app's token/id for backend data.
        // This flow would need adjustment if Google-signed-in users need to save data to your DB.
        // For now, it logs them in on the client-side.
        login({ name: userInfo.name, email: userInfo.email, id: userInfo.sub }); // Use Google's `sub` as a unique ID
      } catch (error) {
        console.error("Failed to fetch user info from Google", error);
        login({ name: 'User' });
      }
      navigate('/home');
    },
    onError: () => toast.error('Google sign-in failed. Please try again.'),
  });

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
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white/50 placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          {["Google", "LinkedIn", "GitHub"].map((provider) => {
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
                onClick={() => {
                  // Simulate OAuth login
                  login();
                  navigate('/home');
                }}
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
