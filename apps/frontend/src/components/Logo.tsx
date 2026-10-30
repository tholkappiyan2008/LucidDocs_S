import React from 'react';

/**
 * The approved ClearDoc logo.
 *
 * One mark, one wordmark, one cohesive brand lockup.
 * Uses the official ClearDoc palette:
 * - Deep teal: #003135
 * - Bright cyan: #0FA4AF
 * - Terracotta: #964734
 * - White: #FFFFFF
 */

const DEEP_TEAL = '#003135';
const BRIGHT_CYAN = '#0FA4AF';

interface LogoMarkProps {
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className = 'h-9 w-9' }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    fill="none"
    role="img"
    aria-label="ClearDoc"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1.5"
      y="1.5"
      width="45"
      height="45"
      rx="10"
      fill={DEEP_TEAL}
      stroke={BRIGHT_CYAN}
      strokeWidth="2"
    />
    {/* Clean document fold / "D" monogram */}
    <path
      d="M16 14h6.5c5.523 0 10 4.477 10 10s-4.477 10-10 10H16V14z"
      stroke={BRIGHT_CYAN}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <circle cx="16" cy="14" r="1.5" fill="#FFFFFF" />
  </svg>
);

interface LogoProps {
  markClassName?: string;
  className?: string;
  markOnly?: boolean;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  markClassName = 'h-9 w-9',
  className = '',
  markOnly = false,
  inverted = false,
}) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark className={markClassName} />
    {!markOnly && (
      <span
        className={`text-lg font-extrabold leading-none tracking-[-0.02em] ${
          inverted ? 'text-white' : 'text-deep-teal'
        }`}
      >
        Clear<span className="text-bright-cyan">Doc</span>
      </span>
    )}
  </span>
);

export default Logo;
