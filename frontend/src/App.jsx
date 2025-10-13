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
import { useAuth } from './components/AuthContext'
import GlobalLoader from './components/GlobalLoader'

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

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/form" element={<Form />} />
          <Route path="/upload" element={<Form />} />

          <Route path="/templates" element={<Templates />} />
          <Route path="/deployment" element={<Deployment />} />
          <Route path="/success" element={<PortfolioSuccess />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
