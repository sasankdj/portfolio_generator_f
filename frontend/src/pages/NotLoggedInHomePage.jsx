import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, FileText, Palette } from 'lucide-react';
import Footer from '../components/Footer';

export default function NotLoggedInHomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-sans">
      {/* Hero Welcome Section */}
      <section className="relative mx-6 md:mx-12 mt-8 rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 p-12 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-black/20 to-black/30 rounded-3xl animate-fade-in"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg animate-slide-up">
            Build Your Standout Portfolio <span className="inline-block animate-bounce">🚀</span>
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
            No account needed to start. Fill in your details, choose a template, and see your portfolio come to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate('/form')}
              className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105"
            >
              📄 Start Building Now
            </button>
            <button
              onClick={() => navigate('/templates')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg shadow-lg hover:bg-white/10 transition-transform transform hover:scale-105"
            >
              🎨 View Templates
            </button>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white bg-opacity-10 rounded-full animate-pulse delay-1000"></div>
      </section>

      {/* Get Started Section */}
      <section className="max-w-7xl mx-auto mt-16 px-6 md:px-12">
        <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center p-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-indigo-100 text-indigo-500">
                <FileText size={32} />
              </div>
              <h4 className="text-xl font-semibold text-indigo-900 mb-2">1. Fill the Form</h4>
              <p className="text-gray-600">
                Provide your professional details, projects, experience, and skills in our guided form. You can even upload a resume to get started faster.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center p-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-purple-100 text-purple-500">
                <Palette size={32} />
              </div>
              <h4 className="text-xl font-semibold text-purple-900 mb-2">2. Choose a Template</h4>
              <p className="text-gray-600">
                Browse our collection of beautiful, professional templates. Preview them with your information to find the perfect fit.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center p-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-100 text-green-500">
                <Github size={32} />
              </div>
              <h4 className="text-xl font-semibold text-green-900 mb-2">3. Sign Up & Deploy</h4>
              <p className="text-gray-600">
                When you're ready, create an account to save your work and deploy your portfolio to a live URL instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto my-16 px-6 md:px-12 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Ready to Begin?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Start creating your professional online presence today. It's free to start.
        </p>
        <button
          onClick={() => navigate('/form')}
          className="px-10 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
        >
          ✨ Let's Build Your Portfolio
        </button>
      </section>

      <Footer />
    </div>
  );
}