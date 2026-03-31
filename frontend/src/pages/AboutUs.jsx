import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">

      {/* Glow background */}
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] bottom-[-100px] right-[-100px]" />

      <main className="flex-1 z-10">
        <section className="relative mx-4 md:mx-8 mt-10 mb-16">

          <div className="max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                About Us
              </h1>

              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Empowering creators to build stunning portfolios with modern tools and clean design.
              </p>
            </div>

            {/* GRID */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">

              {/* LEFT */}
              <div className="space-y-8">

                {/* MISSION */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg hover:shadow-green-500/20 transition">

                  <h2 className="text-2xl font-bold text-white mb-4">
                    Our Mission
                  </h2>

                  <p className="text-gray-400 mb-6">
                    To make professional portfolio creation simple, fast, and accessible for everyone.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">

                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                      <h3 className="text-green-400 font-semibold mb-1">Innovation</h3>
                      <p className="text-sm text-gray-400">
                        Modern tools with powerful features
                      </p>
                    </div>

                    <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                      <h3 className="text-yellow-400 font-semibold mb-1">Accessibility</h3>
                      <p className="text-sm text-gray-400">
                        Built for everyone, not just experts
                      </p>
                    </div>

                  </div>
                </div>

                {/* VISION */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg hover:shadow-yellow-500/20 transition">

                  <h2 className="text-2xl font-bold text-white mb-4">
                    Our Vision
                  </h2>

                  <p className="text-gray-400">
                    To become the go-to platform for portfolio creation and redefine digital presence.
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-8">

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg hover:shadow-green-500/20 transition">

                  <h2 className="text-2xl font-bold text-white mb-4">
                    Our Story
                  </h2>

                  <div className="space-y-4 text-gray-400">
                    <p>
                      We started with a simple idea: everyone deserves a beautiful platform to showcase their work.
                    </p>

                    <p>
                      Traditional portfolio creation was complicated and time-consuming. We simplified it.
                    </p>

                    <p>
                      Today, we help creators build stunning portfolios in minutes.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* CTA */}
            <div className="text-center">

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-xl">

                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to build your portfolio?
                </h2>

                <p className="text-gray-400 mb-8">
                  Join creators who are already showcasing their work professionally.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">

                  <Link
                    to="/home"
                    className="px-8 py-4 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                  >
                    Get Started
                  </Link>

                  <Link
                    to="/templates"
                    className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                  >
                    View Templates
                  </Link>

                </div>
              </div>

            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}