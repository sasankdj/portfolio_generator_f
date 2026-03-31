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

  // NavLink style
  const navItemStyle = ({ isActive }) =>
    `text-lg font-medium transition-all duration-300 ${
      isActive ? 'text-green-400' : 'text-gray-300'
    } hover:text-green-400`;

  const navLinks = (
    <>
      {isLoggedIn && (
        <>
          <NavLink to="/home" className={navItemStyle}>Home</NavLink>
          <NavLink to="/templates" className={navItemStyle}>Templates</NavLink>
        </>
      )}

      <NavLink to="/about" className={navItemStyle}>About</NavLink>

      {!isLoggedIn ? (
        <>
          <NavLink to="/login" className={navItemStyle}>Login</NavLink>

          {/* Signup Button */}
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full bg-green-500 text-black font-semibold 
            hover:bg-green-400 transition-all duration-300 
            shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            Signup
          </Link>
        </>
      ) : (
        <button
          onClick={handleLogout}
          className="text-gray-300 hover:text-red-400 transition-all duration-300"
        >
          Logout
        </button>
      )}
    </>
  );

  return (
    <>
      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10"
      >
        <div className="h-20 flex items-center justify-between px-4 md:px-16">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <motion.img
              whileHover={{ scale: 1.1, rotate: 3 }}
              src="/logo.png"
              alt="Portfolio logo"
              className="w-12 h-12 rounded-full"
            />

            <motion.h1
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold text-white tracking-wide"
            >
              Foliovate
            </motion.h1>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks}
          </div>

          {/* MOBILE BUTTON */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className="md:hidden absolute top-20 left-0 w-full backdrop-blur-xl bg-black/90 border-b border-white/10 z-40"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex flex-col items-center gap-6 py-8 text-lg">
              {navLinks}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;