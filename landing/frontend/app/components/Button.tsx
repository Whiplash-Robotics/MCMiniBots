import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const { isDark } = useTheme();

  const baseClasses = `
    transition-all duration-200 font-semibold rounded-lg border outline-none cursor-pointer
    active:scale-95 disabled:cursor-not-allowed disabled:opacity-50
  `;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const getVariantClasses = () => {
    if (variant === 'gold') {
      return isDark
        ? 'bg-gold-500 text-gray-900 border-gold-600 [box-shadow:var(--shadow-md-dark),var(--glow-gold-sm)] hover:[box-shadow:var(--shadow-lg-dark),var(--glow-gold)] hover:bg-gold-400'
        : 'bg-gold-500 text-white border-gold-600 [box-shadow:var(--shadow-md-light)] hover:[box-shadow:var(--shadow-lg-light)] hover:bg-gold-600';
    }

    if (variant === 'secondary') {
      return isDark
        ? 'bg-surface-dark-hover text-gray-300 border-border-dark [box-shadow:var(--shadow-dark)] hover:[box-shadow:var(--shadow-md-dark)] hover:text-gray-100'
        : 'bg-surface-light-hover text-gray-700 border-border-light [box-shadow:var(--shadow-light)] hover:[box-shadow:var(--shadow-md-light)] hover:text-gray-900';
    }

    if (variant === 'ghost') {
      return isDark
        ? 'bg-transparent text-gray-400 border-border-dark hover:bg-surface-dark hover:text-gold-400'
        : 'bg-transparent text-gray-600 border-border-light hover:bg-surface-light hover:text-gold-600';
    }

    // primary
    return isDark
      ? 'bg-surface-dark text-gray-100 border-border-dark [box-shadow:var(--shadow-md-dark)] hover:[box-shadow:var(--shadow-lg-dark)] hover:border-gold-500 hover:text-gold-400'
      : 'bg-surface-light text-gray-900 border-border-light [box-shadow:var(--shadow-md-light)] hover:[box-shadow:var(--shadow-lg-light)] hover:border-gold-500 hover:text-gold-600';
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;