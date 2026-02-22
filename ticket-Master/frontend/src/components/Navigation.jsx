import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { FaBars, FaTimes, FaTicketAlt, FaSignOutAlt, FaUser, FaCog } from 'react-icons/fa';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl">
            <FaTicketAlt size={24} />
            <span>Ticket Master</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`hover:text-blue-200 transition ${isActive('/') ? 'text-blue-200 border-b-2' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className={`hover:text-blue-200 transition ${isActive('/dashboard') ? 'text-blue-200 border-b-2' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/saved-events"
              className={`hover:text-blue-200 transition ${isActive('/saved-events') ? 'text-blue-200 border-b-2' : ''}`}
            >
              Saved Events
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`hover:text-blue-200 transition ${isActive('/admin') ? 'text-blue-200 border-b-2' : ''}`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                src={user?.profile_picture || `https://i.pravatar.cc/40?u=${user?.email}`}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm">{user?.first_name}</span>
            </div>
            <Link to="/profile" className="hover:text-blue-200 transition">
              <FaUser size={18} />
            </Link>
            <button
              onClick={handleLogout}
              className="hover:text-blue-200 transition flex items-center space-x-1"
            >
              <FaSignOutAlt size={18} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 hover:bg-blue-700 rounded"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="block px-4 py-2 hover:bg-blue-700 rounded"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/saved-events"
              className="block px-4 py-2 hover:bg-blue-700 rounded"
              onClick={() => setIsOpen(false)}
            >
              Saved Events
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="block px-4 py-2 hover:bg-blue-700 rounded"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
            )}
            <Link
              to="/profile"
              className="block px-4 py-2 hover:bg-blue-700 rounded"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-blue-700 rounded flex items-center space-x-2"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
