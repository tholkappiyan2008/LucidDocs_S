import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  /** seconds of delay — stagger by passing 0, 0.08, 0.16 … */
  delay?: number;
  /** starting vertical offset in px */
  y?: number;
  className?: string;
}

/**
 * Subtle fade-up reveal. Animation is disabled for reduced-motion users,
 * in which case content renders immediately in its final position.
 */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 20, className }) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
