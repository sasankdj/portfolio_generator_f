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
    if (isLoggedIn) navigate("/home");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    const handleGitHubCallback = async (authCode) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: authCode }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
          const userData = {
            name: data.name,
            email: data.email,
            token: data.token,
            id: data.id,
          };

          login(userData);
          await saveUserDetails({ email: data.email, fullName: data.name });

          if (location.state?.action === "createPortfolio") {
            toast.success("Logged in! Now generating your portfolio...");
            navigate("/form", { state: { action: "createPortfolio" }, replace: true });
          } else {
            fetchUserDetails(userData);
            navigate("/home", { replace: true });
          }
        } else {
          throw new Error(data.msg || "GitHub login failed.");
        }
      } catch (err) {
        setAuthError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (code) handleGitHubCallback(code);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const userData = {
          name: data.name,
          email: data.email,
          token: data.token,
          id: data.id,
        };

        login(userData);
        await saveUserDetails({ email: data.email, fullName: data.name });

        if (location.state?.action === "createPortfolio") {
          toast.success("Logged in! Now generating your portfolio...");
          navigate("/form", { state: { action: "createPortfolio" }, replace: true });
        } else {
          await fetchUserDetails(userData);
          navigate("/home");
        }
      } else {
        setAuthError(data.msg || "Invalid credentials");
      }
    } catch {
      setAuthError("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();

        if (res.ok) {
          const userData = {
            name: data.name,
            email: data.email,
            token: data.token,
            id: data.id,
          };

          login(userData);
          await saveUserDetails({ ...userDetails, email: data.email });

          navigate("/home");
        } else {
          setAuthError("Google login failed");
        }
      } catch {
        setAuthError("Google login error");
      }

      setLoading(false);
    },
    onError: () => toast.error("Google sign-in failed"),
  });

  const handleGitHubSignIn = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&redirect_uri=${redirectUri}`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">

      {/* glow */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      <div className="w-full max-w-md p-8 space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 z-10">

        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Login</h1>
          <p className="text-gray-400 mt-2">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-green-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-green-500 outline-none"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

          {authError && <p className="text-red-400 text-sm">{authError}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 transition shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        <div className="flex items-center text-gray-500">
          <hr className="flex-grow border-white/10" />
          <span className="px-3 text-sm">OR</span>
          <hr className="flex-grow border-white/10" />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleGoogleSignIn}
            className="flex-1 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
          >
            Google
          </button>

          <button
            onClick={handleGitHubSignIn}
            className="flex-1 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
          >
            GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;