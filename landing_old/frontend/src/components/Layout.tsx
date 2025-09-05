import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-neuro-dark text-white' : 'bg-neuro-light text-gray-800'
    }`}>
      <nav className={`${
        isDark ? 'bg-neuro-dark' : 'bg-neuro-light'
      } shadow-neuro-${isDark ? 'dark' : 'light'} p-6`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-gold-500 hover:text-gold-600 transition-colors">
              MCMiniBots Tournament
            </Link>
            <div className="flex space-x-6">
              <Link
                to="/"
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'text-white hover:shadow-neuro-dark-inset'
                    : 'text-gray-800 hover:shadow-neuro-light-inset'
                }`}
              >
                Home
              </Link>
              <Link
                to="/submit"
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'text-white hover:shadow-neuro-dark-inset'
                    : 'text-gray-800 hover:shadow-neuro-light-inset'
                }`}
              >
                Submit Bot
              </Link>
              <Link
                to="/token-counter"
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'text-white hover:shadow-neuro-dark-inset'
                    : 'text-gray-800 hover:shadow-neuro-light-inset'
                }`}
              >
                Token Counter
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-xl transition-all duration-200 shadow-neuro-${isDark ? 'dark' : 'light'} hover:shadow-neuro-${isDark ? 'dark' : 'light'}-inset`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gold-500">Welcome, {user.username}</span>
                {user.isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-xl transition-all duration-200 bg-gold-500 text-white hover:bg-gold-600 shadow-neuro-${isDark ? 'dark' : 'light'}`}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 shadow-neuro-${isDark ? 'dark' : 'light'} hover:shadow-neuro-${isDark ? 'dark' : 'light'}-inset`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`px-6 py-2 rounded-xl transition-all duration-200 bg-gold-500 text-white hover:bg-gold-600 shadow-neuro-${isDark ? 'dark' : 'light'}`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;