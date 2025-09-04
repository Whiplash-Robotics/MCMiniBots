import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface NeuroInputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const NeuroInput: React.FC<NeuroInputProps> = ({
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
    w-full px-4 py-3 rounded-xl border-none outline-none transition-all duration-200
    disabled:cursor-not-allowed disabled:opacity-50
  `;

  const shadowClasses = isDark
    ? 'shadow-neuro-dark-inset focus:shadow-neuro-dark'
    : 'shadow-neuro-light-inset focus:shadow-neuro-light';

  const backgroundClasses = isDark
    ? 'bg-neuro-dark text-white placeholder-gray-400'
    : 'bg-neuro-light text-gray-800 placeholder-gray-500';

  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${
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
          ${shadowClasses}
          ${backgroundClasses}
        `}
      />
    </div>
  );
};

export default NeuroInput;