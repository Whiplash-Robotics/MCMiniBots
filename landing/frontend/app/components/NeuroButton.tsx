import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface NeuroButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const NeuroButton: React.FC<NeuroButtonProps> = ({
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
    transition-all duration-200 font-medium rounded-xl border-none outline-none cursor-pointer
    active:scale-95 disabled:cursor-not-allowed disabled:opacity-50
  `;

  const shadowClasses = isDark
    ? `shadow-neuro-dark hover:shadow-neuro-dark-inset active:shadow-neuro-dark-inset`
    : `shadow-neuro-light hover:shadow-neuro-light-inset active:shadow-neuro-light-inset`;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: isDark
      ? 'bg-neuro-dark text-white'
      : 'bg-neuro-light text-gray-800',
    secondary: isDark
      ? 'bg-gray-700 text-white'
      : 'bg-gray-200 text-gray-800',
    gold: 'bg-gold-500 text-white hover:bg-gold-600',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${shadowClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default NeuroButton;