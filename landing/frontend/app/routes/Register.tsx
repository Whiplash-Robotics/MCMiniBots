import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import NeuroCard from '../components/NeuroCard';
import NeuroButton from '../components/NeuroButton';
import { useTheme } from '../context/ThemeContext';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store the token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to home page
        navigate('/');
      } else {
        setApiError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setApiError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gold-500 mb-2">Create Account</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Join the MCMinibots Tournament
            </p>
          </div>

          <NeuroCard className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {apiError && (
                <div className={`p-4 rounded-xl ${
                  isDark 
                    ? 'bg-red-900 text-red-300 shadow-neuro-dark-inset' 
                    : 'bg-red-100 text-red-700 shadow-neuro-light-inset'
                }`}>
                  {apiError}
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-neuro-dark shadow-neuro-dark-inset text-white placeholder-gray-500'
                      : 'bg-neuro-light shadow-neuro-light-inset text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-gold-500`}
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-neuro-dark shadow-neuro-dark-inset text-white placeholder-gray-500'
                      : 'bg-neuro-light shadow-neuro-light-inset text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-gold-500`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-neuro-dark shadow-neuro-dark-inset text-white placeholder-gray-500'
                      : 'bg-neuro-light shadow-neuro-light-inset text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-gold-500`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-neuro-dark shadow-neuro-dark-inset text-white placeholder-gray-500'
                      : 'bg-neuro-light shadow-neuro-light-inset text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-gold-500`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <NeuroButton
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </NeuroButton>

              {/* Login Link */}
              <div className="text-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-gold-500 hover:text-gold-400 font-medium"
                  >
                    Sign in
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

export default Register;