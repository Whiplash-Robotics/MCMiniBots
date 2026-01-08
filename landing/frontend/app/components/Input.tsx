import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  className = '',
  label,
}) => {
  const { isDark } = useTheme();

  const baseClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-200
    disabled:cursor-not-allowed disabled:opacity-50
  `;

  const inputClasses = isDark
    ? 'bg-surface-dark text-gray-100 placeholder-gray-500 border-border-dark focus:border-gold-500 focus:[box-shadow:var(--shadow-md-dark),var(--glow-gold-sm)]'
    : 'bg-surface-light text-gray-900 placeholder-gray-400 border-border-light focus:border-gold-500 focus:[box-shadow:var(--shadow-md-light)]';

  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-semibold mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${inputClasses}
        `}
      />
    </div>
  );
};

export default Input;