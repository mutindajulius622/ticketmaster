import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isOwner, isTenant } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'var(--danger-500)';
      case 'owner': return 'var(--primary-500)';
      case 'tenant': return 'var(--secondary-500)';
      default: return 'var(--gray-500)';
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🏠 Palmer Living Reality
        </Link>
        
        {/* Desktop Navigation */}
        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          
          <Link 
            to="/properties" 
            className={`nav-link ${isActive('/properties') ? 'active' : ''}`}
          >
            Properties
          </Link>

          {isAuthenticated() ? (
            <>
              {isAdmin() && (
                <Link 
                  to="/admin" 
                  className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  Admin Panel
                </Link>
              )}
              
              {isOwner() && (
                <Link 
                  to="/owner" 
                  className={`nav-link ${isActive('/owner') ? 'active' : ''}`}
                >
                  My Properties
                </Link>
              )}
              
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              
              <Link 
                to="/payments" 
                className={`nav-link ${isActive('/payments') ? 'active' : ''}`}
              >
                💳 Payments
              </Link>
              
              <div className="flex gap-1" style={{ alignItems: 'center', marginLeft: '0.5rem' }}>
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  background: getRoleColor(user?.role),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="nav-link" style={{ cursor: 'default', padding: '0.5rem' }}>
                  {user?.username}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-outline btn-sm"
                  style={{ marginLeft: '0.5rem' }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary btn-sm"
                style={{ marginLeft: '0.5rem' }}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="btn btn-secondary btn-sm"
          style={{ display: 'none', padding: '0.5rem' }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

