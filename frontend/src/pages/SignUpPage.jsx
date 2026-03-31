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
  <div className="min-h-screen flex bg-[#0a0a0a] relative overflow-hidden">

    {/* Glow background */}
    <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
    <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

    {/* MAIN CONTAINER */}
    <div className="flex w-full max-w-6xl mx-auto my-10 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 z-10">

      {/* LEFT SIDE - FORM */}
      <div className="w-full md:w-1/2 p-8">

        <h1 className="text-3xl font-bold text-white mb-2">
          Create Account
        </h1>

        <p className="text-gray-400 mb-6">
          Already have an account?{" "}
          <Link to="/login" className="text-green-400 hover:underline">
            Login
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* NAME */}
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-green-500 outline-none"
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-green-500 outline-none"
          />
          {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}

          {/* PHONE */}
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-green-500 outline-none"
          />

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}

          {/* CONFIRM PASSWORD */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
          )}

          {errors.general && (
            <p className="text-red-400 text-sm">{errors.general}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 transition shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>

      {/* RIGHT SIDE - SOCIAL + INFO */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center p-10 border-l border-white/10">

        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Join us today 🚀
        </h2>

        <p className="text-gray-400 text-center mb-8 max-w-sm">
          Create your professional portfolio in minutes and showcase your skills like a pro.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">

          <button
            onClick={() => handleGoogleSignIn()}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20 transition"
          >
            Continue with Google
          </button>

          <button
            onClick={handleGitHubSignIn}
            className="w-full py-3 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20 transition"
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  </div>
);
};


export default SignUpPage;
