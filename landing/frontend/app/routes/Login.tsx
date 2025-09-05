import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import NeuroCard from '../components/NeuroCard';
import NeuroButton from '../components/NeuroButton';
import { useTheme } from '../context/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store the token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to home page
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gold-500 mb-2">Sign In</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Access your MCMinibots account
            </p>
          </div>

          <NeuroCard className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className={`p-4 rounded-xl ${
                  isDark 
                    ? 'bg-red-900 text-red-300 shadow-neuro-dark-inset' 
                    : 'bg-red-100 text-red-700 shadow-neuro-light-inset'
                }`}>
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-neuro-dark shadow-neuro-dark-inset text-white placeholder-gray-500'
                      : 'bg-neuro-light shadow-neuro-light-inset text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-gold-500`}
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-neuro-dark shadow-neuro-dark-inset text-white placeholder-gray-500'
                      : 'bg-neuro-light shadow-neuro-light-inset text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-gold-500`}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Submit Button */}
              <NeuroButton
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </NeuroButton>

              {/* Register Link */}
              <div className="text-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-gold-500 hover:text-gold-400 font-medium"
                  >
                    Create one
                  </Link>
                </span>
              </div>
            </form>
          </NeuroCard>
        </div>
      </div>
    </div>
  );
};

export default Login;
