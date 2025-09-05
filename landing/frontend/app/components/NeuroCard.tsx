import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface NeuroCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const NeuroCard: React.FC<NeuroCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const { isDark } = useTheme();

  const baseClasses = `
    rounded-2xl transition-all duration-300
    ${onClick ? 'cursor-pointer' : ''}
  `;

  const shadowClasses = isDark
    ? `shadow-neuro-dark ${hoverable ? 'hover:shadow-neuro-dark-inset' : ''} ${onClick ? 'active:shadow-neuro-dark-inset' : ''}`
    : `shadow-neuro-light ${hoverable ? 'hover:shadow-neuro-light-inset' : ''} ${onClick ? 'active:shadow-neuro-light-inset' : ''}`;

  const backgroundClasses = isDark
    ? 'bg-neuro-dark text-white'
    : 'bg-neuro-light text-gray-800';

  return (
    <div
      onClick={onClick}
      className={`
        ${baseClasses}
        ${shadowClasses}
        ${backgroundClasses}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default NeuroCard;