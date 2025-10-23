import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'

import Form from './pages/Form'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Templates from './pages/Templates'
import Deployment from './pages/Deployment'

import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import Feedback from './pages/Feedback'
import PortfolioSuccess from './pages/PortfolioSuccess'
import ProtectedRoute from './components/ProtectedRoute'
import { Analytics } from '@vercel/analytics/react';
import GlobalLoader from './components/GlobalLoader'
import ResumeSuccess from './pages/ResumeSuccess'
import ResumeTemplates from './pages/ResumeTemplates'
import NotLoggedInHomePage from './pages/NotLoggedInHomePage'
import NetlifyCallback from './pages/NetlifyCallback'
import VercelCallback from './pages/VercelCallback'
const App = () => {
  return (
    <Router>
      <Navbar />
      <GlobalLoader />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/not-logged-in-home" element={<NotLoggedInHomePage />} />
        <Route path="/form" element={<Form />} />
        <Route path="/templates" element={<Templates />} />

        {/* Auth Callbacks */}
        <Route path="/auth/netlify/callback" element={<NetlifyCallback />} />
        <Route path="/auth/vercel/callback" element={<VercelCallback />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/upload" element={<Form />} />
          <Route path="/deployment" element={<Deployment />} />
          <Route path="/success" element={<PortfolioSuccess />} />
          <Route path="/feedback" element={<Feedback />} />
           <Route path="/resume-templates" element={<ResumeTemplates />} />
      <Route path="/resume-success" element={<ResumeSuccess />} />
        </Route>
      </Routes>
        <Analytics />
    </Router>
  )
}

export default App
