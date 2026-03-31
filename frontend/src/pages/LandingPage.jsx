import React, { useEffect } from "react";
import {
  Rocket,
  Wand2,
  Upload,
  FileText,
  Palette,
  Zap,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import "@fontsource/itim";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-between px-6 py-8 font-itim relative overflow-hidden">

      {/* subtle background glow */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      {/* HERO */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center text-center mt-12 max-w-4xl z-10"
      >
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          CREATE A <span className="text-green-400">PREMIUM</span> PORTFOLIO  
          <br /> IN MINUTES
        </motion.h1>

        <p className="mt-4 text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
          Transform your career story into a stunning online portfolio with our
          AI-powered generator. Clean, modern, and built for impact.
        </p>

        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 25px rgba(34,197,94,0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          className="mt-8 px-8 py-4 rounded-full bg-green-500 text-black font-semibold text-lg flex items-center gap-3 transition-all duration-300 hover:bg-green-400"
          onClick={() => navigate("/not-logged-in-home")}
        >
          GET STARTED <Rocket className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* FEATURES */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-20 mb-16 w-full max-w-6xl z-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Powerful Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Upload />,
              title: "Resume Upload",
              desc: "Upload your resume and auto-fill portfolio data instantly.",
            },
            {
              icon: <FileText />,
              title: "Guided Forms",
              desc: "Step-by-step smart input system with AI suggestions.",
            },
            {
              icon: <Palette />,
              title: "Modern Templates",
              desc: "Minimal, premium templates designed for impact.",
            },
            {
              icon: <FileText />,
              title: "Resume Builder",
              desc: "Generate ATS-friendly resumes in one click.",
            },
            {
              icon: <Zap />,
              title: "Instant Deploy",
              desc: "Launch your portfolio live instantly.",
            },
            {
              icon: <Shield />,
              title: "Secure Auth",
              desc: "Your data is safe with strong authentication.",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{
                scale: 1.05,
                y: -8,
              }}
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg hover:shadow-green-500/20 transition-all duration-300"
            >
              <div className="mb-4 p-3 rounded-full bg-green-500/10 text-green-400 w-fit">
                {feature.icon}
              </div>

              <h3 className="text-xl font-semibold mb-2">
                {feature.title}
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8 text-center z-10"
      >
        <p className="text-gray-400 mb-4">
          Ready to showcase your talent?
        </p>

        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 20px rgba(234,179,8,0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-lg bg-yellow-400 text-black font-medium flex items-center gap-2 hover:bg-yellow-300 transition-all"
          onClick={() => navigate("/login")}
        >
          LOGIN <Wand2 className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}