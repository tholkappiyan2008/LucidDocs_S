import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useA11y } from '../context/A11yContext';
import { scrollToTarget } from '../lib/scroll';
import { Logo } from './Logo';
import { Eye, Type, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  const { highContrast, toggleHighContrast, largeText, toggleLargeText } = useA11y();
  const navigate = useNavigate();
  const location = useLocation();

  const jump = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => scrollToTarget(id), 140);
      return;
    }
    scrollToTarget(id);
  };

  const heading = 'text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-bright-cyan mb-4';
  const link =
    'block py-1.5 text-sm text-white/75 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-cyan rounded-xs text-left cursor-pointer';

  return (
    <footer className="border-t border-white/10 bg-deep-teal text-white">
      <div className="shell py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <Link
              to="/"
              className="inline-block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-cyan"
              aria-label="ClearDoc home"
            >
              <Logo inverted={true} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              ClearDoc transforms complex paperwork, electricity bills, hospital discharge
              summaries, and legal notices into plain language with grounded facts, deadlines, and
              audio read-aloud.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
              <HeartHandshake className="h-4 w-4 text-bright-cyan" />
              <span>Built for accessibility and digital inclusion</span>
            </div>
          </div>

          {/* Product Links */}
          <nav aria-label="Product links" className="md:col-span-3 md:col-start-7">
            <h2 className={heading}>Product</h2>
            <button type="button" onClick={() => jump('#how-it-works')} className={link}>
              How it works
            </button>
            <button type="button" onClick={() => jump('#features')} className={link}>
              Capabilities
            </button>
            <button type="button" onClick={() => jump('#preview')} className={link}>
              Document preview
            </button>
            <Link to="/upload" className={link}>
              Upload a document
            </Link>
            <Link to="/history" className={link}>
              Document history
            </Link>
          </nav>

          {/* Accessibility & Inclusive Design */}
          <nav aria-label="Accessibility settings" className="md:col-span-4">
            <h2 className={heading}>Accessibility</h2>
            <p className="py-1 text-sm text-white/70 leading-relaxed">
              Designed with high contrast, large typography scaling, keyboard shortcuts, and screen
              reader friendliness.
            </p>
            <div className="mt-4 flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={toggleHighContrast}
                aria-pressed={highContrast}
                className="inline-flex items-center gap-2 border border-white/20 px-3.5 py-2 text-xs font-semibold rounded-sm text-white/85 hover:border-bright-cyan hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-bright-cyan" />
                <span>{highContrast ? 'High contrast active' : 'Enable high contrast'}</span>
              </button>

              <button
                type="button"
                onClick={toggleLargeText}
                aria-pressed={largeText}
                className="inline-flex items-center gap-2 border border-white/20 px-3.5 py-2 text-xs font-semibold rounded-sm text-white/85 hover:border-bright-cyan hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Type className="h-3.5 w-3.5 text-bright-cyan" />
                <span>{largeText ? 'Large text active (118%)' : 'Enable larger typography'}</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between text-xs text-white/60">
          <p>© {new Date().getFullYear()} ClearDoc. In-memory document privacy.</p>
          <div className="flex items-center gap-6">
            <span>English (V1 Scope)</span>
            <span className="h-1 w-1 rounded-full bg-bright-cyan" />
            <span>WCAG AA Accessible</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
