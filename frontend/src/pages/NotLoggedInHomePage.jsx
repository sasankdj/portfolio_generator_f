import React from "react";
import { useNavigate } from "react-router-dom";
import { Github, FileText, Palette, Rocket } from "lucide-react";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function NotLoggedInHomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden px-6 py-10">

      {/* 🔥 GLOBAL GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto text-center mt-10 mb-20 relative z-10"
      >
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Build Your <span className="text-green-400">Portfolio</span>  
          <br /> Without Signing Up
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Start instantly. Enter your details, pick a template, and watch your portfolio come alive.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 25px rgba(34,197,94,0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/form")}
            className="px-8 py-4 rounded-full bg-green-500 text-black font-semibold flex items-center gap-2 justify-center"
          >
            Start Building <Rocket size={18} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/templates")}
            className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 flex items-center gap-2 justify-center"
          >
            View Templates
          </motion.button>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-20 relative z-10"
      >

        {[
          {
            icon: <FileText />,
            title: "Fill Details",
            desc: "Enter your skills, projects, and experience using our guided form.",
          },
          {
            icon: <Palette />,
            title: "Choose Template",
            desc: "Select from modern, clean templates designed for impact.",
          },
          {
            icon: <Github />,
            title: "Deploy",
            desc: "Publish your portfolio instantly and share your work.",
          },
        ].map((step, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, y: -8 }}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg hover:shadow-green-500/20 transition-all"
          >
            <div className="mb-4 p-3 rounded-full bg-green-500/10 text-green-400 w-fit">
              {step.icon}
            </div>

            <h3 className="text-xl font-semibold mb-2">
              {step.title}
            </h3>

            <p className="text-gray-400 text-sm">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </motion.section>

      {/* FINAL CTA */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-16 relative z-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Get Started?
        </h2>

        <p className="text-gray-400 mb-6">
          Build your professional portfolio in minutes.
        </p>

        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 25px rgba(34,197,94,0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/form")}
          className="px-10 py-4 rounded-full bg-green-500 text-black font-semibold"
        >
          
          Create Portfolio
        </motion.button>
      </motion.section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}