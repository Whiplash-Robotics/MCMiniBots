import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { isDark } = useTheme();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const success = await login(email, password);

      if (success) {
        // Redirect to home page
        navigate('/');
      } else {
        setError('Login failed. Please check your credentials.');
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
      <div className="px-6 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>Sign In</h1>
            <div className={`h-0.5 w-16 mx-auto rounded-full mb-4 ${isDark ? 'bg-gold-500' : 'bg-gold-600'}`} />
            <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Access your MCMinibots account
            </p>
          </div>

          <Card className="p-8" glow={isDark}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className={`p-4 rounded-lg border ${
                  isDark
                    ? 'bg-red-900/20 text-red-400 border-red-500/30'
                    : 'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {error}
                </div>
              )}

              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />

              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center pt-4">
                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className={`font-semibold ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-gold-600 hover:text-gold-700'}`}
                  >
                    Create one
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

export default Login;
