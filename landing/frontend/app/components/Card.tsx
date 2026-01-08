import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  glow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  glow = false,
}) => {
  const { isDark } = useTheme();

  const baseClasses = `
    rounded-xl border transition-all duration-300
    ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
  `;

  const shadowClasses = isDark
    ? `[box-shadow:var(--shadow-md-dark)] ${hoverable || onClick ? 'hover:[box-shadow:var(--shadow-lg-dark)]' : ''}`
    : `[box-shadow:var(--shadow-md-light)] ${hoverable || onClick ? 'hover:[box-shadow:var(--shadow-lg-light)]' : ''}`;

  const backgroundClasses = isDark
    ? 'bg-surface-dark text-gray-100 border-border-dark'
    : 'bg-surface-light text-gray-900 border-border-light';

  const glowClass = glow && isDark ? '[box-shadow:var(--shadow-md-dark),var(--glow-gold-sm)] hover:[box-shadow:var(--shadow-lg-dark),var(--glow-gold)]' : '';

  return (
    <div
      onClick={onClick}
      className={`
        ${baseClasses}
        ${shadowClasses}
        ${backgroundClasses}
        ${glowClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;