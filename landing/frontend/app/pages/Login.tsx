import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import NeuroCard from '../components/NeuroCard';
import NeuroInput from '../components/NeuroInput';
import NeuroButton from '../components/NeuroButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, login } = useAuth();
  const { isDark } = useTheme();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    
    if (!success) {
      setError('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <NeuroCard className="p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gold-500 mb-2">Login</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in to submit your bots
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <NeuroInput
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          
          <NeuroInput
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <NeuroButton
            type="submit"
            variant="gold"
            size="lg"
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </NeuroButton>
        </form>

        <div className={`text-center text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p>Don't have an account? Contact an admin to register.</p>
        </div>
      </NeuroCard>
    </div>
  );
};

export default Login;