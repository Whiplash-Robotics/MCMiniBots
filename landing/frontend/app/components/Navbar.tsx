import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useTheme } from '../context/ThemeContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const Navbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Check for stored user data
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/submit', label: 'Submit', icon: '🚀' },
    { path: '/token', label: 'Token Counter', icon: '📊' },
  ];

  // Add admin navigation for admin users
  if (user?.isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`sticky top-0 z-50 py-4 px-6 ${
      isDark 
        ? 'bg-neuro-dark' 
        : 'bg-neuro-light'
    } backdrop-blur-sm border-b border-opacity-20 ${
      isDark ? 'border-gray-700' : 'border-gray-300'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Brand */}
        <Link to="/" className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-200 ${
            isDark
              ? 'bg-neuro-dark shadow-neuro-dark text-gold-400 hover:shadow-neuro-dark-inset'
              : 'bg-neuro-light shadow-neuro-light text-gold-600 hover:shadow-neuro-light-inset'
          }`}>
            🤖
          </div>
          <span className={`font-bold text-lg ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
            MCMinibots
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? isDark
                    ? 'bg-neuro-dark shadow-neuro-dark-inset text-gold-400'
                    : 'bg-neuro-light shadow-neuro-light-inset text-gold-600'
                  : isDark
                    ? 'bg-neuro-dark shadow-neuro-dark text-gray-300 hover:shadow-neuro-dark-inset hover:text-gold-400'
                    : 'bg-neuro-light shadow-neuro-light text-gray-700 hover:shadow-neuro-light-inset hover:text-gold-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Theme Toggle & Auth */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-200 ${
              isDark
                ? 'bg-neuro-dark shadow-neuro-dark text-yellow-400 hover:shadow-neuro-dark-inset'
                : 'bg-neuro-light shadow-neuro-light text-gray-700 hover:shadow-neuro-light-inset'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Auth Buttons */}
          {user ? (
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Welcome, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-neuro-dark shadow-neuro-dark text-gray-300 hover:shadow-neuro-dark-inset hover:text-red-400'
                    : 'bg-neuro-light shadow-neuro-light text-gray-700 hover:shadow-neuro-light-inset hover:text-red-600'
                }`}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-neuro-dark shadow-neuro-dark text-gray-300 hover:shadow-neuro-dark-inset hover:text-gold-400'
                    : 'bg-neuro-light shadow-neuro-light text-gray-700 hover:shadow-neuro-light-inset hover:text-gold-600'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-neuro-dark shadow-neuro-dark text-gold-400 hover:shadow-neuro-dark-inset'
                    : 'bg-neuro-light shadow-neuro-light text-gold-600 hover:shadow-neuro-light-inset'
                }`}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;