import React from 'react';
import { Link, useLocation } from 'react-router';
import { Home, Trophy, Upload, Calculator, Shield, Sun, Moon, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const Navbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/submit', label: 'Submit', icon: Upload },
    { path: '/token', label: 'Token Counter', icon: Calculator },
  ];

  // Add admin navigation for admin users
  if (user?.isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin', icon: Shield });
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-lg border-b transition-all duration-300 ${
      isDark
        ? 'bg-surface-dark/90 border-border-dark [box-shadow:var(--shadow-sm-dark)]'
        : 'bg-surface-light/90 border-border-light [box-shadow:var(--shadow-sm-light)]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold transition-all duration-200 ${
            isDark
              ? 'bg-gradient-to-br from-gold-500 to-gold-600 border-gold-600 text-gray-900 group-hover:[box-shadow:var(--glow-gold-sm)]'
              : 'bg-gradient-to-br from-gold-400 to-gold-600 border-gold-600 text-white group-hover:[box-shadow:var(--shadow-md-light)]'
          }`}>
            <span className="text-sm">MC</span>
          </div>
          <div className="hidden sm:block">
            <span className={`font-bold text-base ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
              MCMinibots
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive(item.path)
                    ? isDark
                      ? 'bg-surface-dark-hover text-gold-400'
                      : 'bg-surface-light-hover text-gold-600'
                    : isDark
                      ? 'text-gray-400 hover:text-gold-400 hover:bg-surface-dark-hover'
                      : 'text-gray-600 hover:text-gold-600 hover:bg-surface-light-hover'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle & Auth */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isDark
                ? 'text-gold-400 hover:bg-surface-dark-hover'
                : 'text-gray-600 hover:bg-surface-light-hover'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth Buttons */}
          {user ? (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium hidden md:inline ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDark
                    ? 'text-gray-400 hover:text-red-400 hover:bg-surface-dark-hover'
                    : 'text-gray-600 hover:text-red-600 hover:bg-surface-light-hover'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDark
                    ? 'text-gray-400 hover:text-gold-400 hover:bg-surface-dark-hover'
                    : 'text-gray-600 hover:text-gold-600 hover:bg-surface-light-hover'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/register"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDark
                    ? 'bg-gold-500 text-gray-900 hover:bg-gold-400 hover:[box-shadow:var(--glow-gold-sm)]'
                    : 'bg-gold-500 text-white hover:bg-gold-600 hover:[box-shadow:var(--shadow-md-light)]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;