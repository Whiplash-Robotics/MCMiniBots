import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { isDark } = useTheme();
  const { setAuthData } = useAuth();
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
        // Store the token and user data in AuthContext
        setAuthData(data.token, data.user);

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
      <div className="px-6 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>Create Account</h1>
            <div className={`h-0.5 w-16 mx-auto rounded-full mb-4 ${isDark ? 'bg-gold-500' : 'bg-gold-600'}`} />
            <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Join the MCMinibots Tournament
            </p>
          </div>

          <Card className="p-8" glow={isDark}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {apiError && (
                <div className={`p-4 rounded-lg border ${
                  isDark
                    ? 'bg-red-900/20 text-red-400 border-red-500/30'
                    : 'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {apiError}
                </div>
              )}

              {/* Username */}
              <div>
                <Input
                  type="text"
                  label="Username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, username: e.target.value }));
                    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                  }}
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Input
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Input
                  type="password"
                  label="Password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Input
                  type="password"
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className={`font-semibold ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-gold-600 hover:text-gold-700'}`}
                  >
                    Sign in
                  </Link>
                </span>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;