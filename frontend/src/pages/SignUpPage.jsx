import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { usePortfolio } from "../components/PortfolioContext";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

const SignUpPage = () => {
  // Add state for the new 'name' field
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth();
  const { fetchUserDetails } = usePortfolio();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home');
    }
  }, [isLoggedIn, navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Password validation
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, phone, password }),
        });

          const data = await response.json();
          if (response.ok) {
            const userData = { name: data.name, email: data.email, token: data.token, id: data.id };
            login(userData);

            // Check if we need to perform a post-login action
            if (location.state?.action === 'createPortfolio') {
              toast.success("Account created! Now generating your portfolio...");
              navigate('/form', { state: { from: '/signup', action: 'createPortfolio' }, replace: true });
            } else {
              await fetchUserDetails(userData); // This will just initialize an empty state
              navigate("/home");
            }
          } else {
            if (response.status === 400 && data.msg === 'User already exists') {
              setErrors({ general: 'User with this email already exists. Please login.' });
            } else {
              setErrors({ general: data.msg || "Sign up failed. Please try again." });
            }
          }
      } catch (error) {
        console.error("Sign up failed", error);
        setErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setErrors({});
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
          // Check if we need to perform a post-login action
          if (location.state?.action === 'createPortfolio') {
            toast.success("Account created! Now generating your portfolio...");
            navigate('/form', { state: { from: '/signup', action: 'createPortfolio' }, replace: true });
          } else {
            await fetchUserDetails(userData);
            navigate('/home');
          }

        } else {
          setErrors({ general: data.msg || 'Google Sign-Up failed.' });
        }
      } catch (error) {
        console.error("Google Sign-Up failed", error);
        setErrors({ general: "An unexpected error occurred during Google Sign-Up." });
      }
      setLoading(false);
    },
    onError: () => toast.error('Google sign-in failed. Please try again.'),
  });

  const handleGitHubSignIn = () => {
    const redirectUri = window.location.origin + '/login'; // Always redirect to login for callback handling
    window.location.assign(`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&redirect_uri=${redirectUri}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 to-purple-300 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/20 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800">Create an account</h1>
          <div className="mt-2 text-gray-600">
            <p>Already have an account?</p>
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ✨ New Field for Name ✨ */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

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
              className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Phone (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
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
                className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white placeholder:text-gray-500/90 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {errors.general && (
          <div className="text-red-500 text-sm text-left">
            {errors.general}
          </div>
        )}

        <button
            type="submit"
            className="w-full py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </form>

        <div className="flex items-center text-gray-500 my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="px-4 text-sm">Or continue with</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleGoogleSignIn()}
            disabled={loading}
            className="flex-1 flex items-center justify-center py-2.5 px-4 border border-gray-300 bg-white rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-black">Google</span>
          </button>
          <button
            onClick={handleGitHubSignIn}
            className="flex-1 flex items-center justify-center py-2.5 px-4 border border-gray-300 bg-white rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="font-medium text-black">GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
};


export default SignUpPage;
