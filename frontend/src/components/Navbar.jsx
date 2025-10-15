import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { isLoggedIn, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = (
    <>
      {isLoggedIn && (
        <>
          <NavLink to="/home" className={({ isActive }) => `text-xl font-semibold ${isActive ? 'text-yellow-300' : 'text-white'} hover:text-yellow-300 transition-all duration-300 drop-shadow-md`}>Home</NavLink>
          <NavLink to="/templates" className={({ isActive }) => `text-xl font-semibold ${isActive ? 'text-yellow-300' : 'text-white'} hover:text-yellow-300 transition-all duration-300 drop-shadow-md`}>Templates</NavLink>
        </>
      )}
      <NavLink to="/about" className={({ isActive }) => `text-xl font-semibold ${isActive ? 'text-yellow-300' : 'text-white'} hover:text-yellow-300 transition-all duration-300 drop-shadow-md`}>About Us</NavLink>
      {/* <NavLink to="/contact" className={({ isActive }) => `text-xl font-semibold ${isActive ? 'text-yellow-300' : 'text-white'} hover:text-yellow-300 transition-all duration-300 drop-shadow-md`}>Contact Us</NavLink> */}
      {!isLoggedIn ? (
        <>
          <NavLink to="/login" className={({ isActive }) => `text-xl font-semibold ${isActive ? 'text-yellow-300' : 'text-white'} hover:text-yellow-300 transition-all duration-300 drop-shadow-md`}>Login</NavLink>
          <Link to="/signup" className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg">
            Signup
          </Link>
        </>
      ) : (
        <button onClick={handleLogout} className="text-xl font-semibold text-white hover:text-red-300 transition-all duration-300 drop-shadow-md">
          Logout
        </button>
      )}
    </>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-gradient-to-r from-purple-400 via-blue-300 to-indigo-400 h-20 flex items-center justify-between px-4 md:px-16 shadow-xl backdrop-blur-md bg-opacity-90 sticky top-0 z-50"
      >
        <Link to="/" className="flex items-center gap-4">
          <motion.img
            whileHover={{ scale: 1.1, rotate: 5 }}
            src="/logo.png"
            alt="Portfolio logo"
            className="w-14 h-14 rounded-full shadow-lg"
          />
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-3xl font-bold text-white drop-shadow-lg"
          >
            Portfolio
          </motion.h1>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
            {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="md:hidden absolute top-20 left-0 w-full bg-gradient-to-br from-purple-400 to-indigo-500 shadow-xl z-40"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex flex-col items-center gap-6 py-8">
              {navLinks}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
