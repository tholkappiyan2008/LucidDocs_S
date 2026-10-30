import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useA11y } from '../context/A11yContext';
import { scrollToTarget } from '../lib/scroll';
import { Logo } from './Logo';
import {
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Eye,
  Type,
  UploadCloud,
  History,
  LayoutDashboard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { highContrast, toggleHighContrast, largeText, toggleLargeText } = useA11y();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  /** Jump to a homepage section, navigating home first if needed. */
  const goToSection = (id: string) => {
    setMenuOpen(false);
    const run = () => scrollToTarget(`#${id}`);
    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(run, 120);
    } else {
      run();
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-deep-teal/10'
          : 'bg-white/80 backdrop-blur-sm border-b border-deep-teal/8'
      }`}
    >
      <div className="shell">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          {/* Brand */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="group inline-flex items-center gap-2.5 rounded-sm p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-cyan"
            aria-label="ClearDoc Home"
          >
            <Logo />
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main" className="hidden md:flex items-center gap-6 lg:gap-8">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'text-deep-teal border-b-2 border-bright-cyan pb-1'
                      : 'text-deep-teal/70 hover:text-deep-teal'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  <span>Workspace</span>
                </Link>
                <Link
                  to="/upload"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                    location.pathname === '/upload'
                      ? 'text-deep-teal border-b-2 border-bright-cyan pb-1'
                      : 'text-deep-teal/70 hover:text-deep-teal'
                  }`}
                >
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  <span>Upload</span>
                </Link>
                <Link
                  to="/history"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                    location.pathname === '/history'
                      ? 'text-deep-teal border-b-2 border-bright-cyan pb-1'
                      : 'text-deep-teal/70 hover:text-deep-teal'
                  }`}
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  <span>History</span>
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => goToSection('how-it-works')}
                  className="text-sm font-semibold text-deep-teal/70 hover:text-deep-teal transition-colors cursor-pointer"
                >
                  How it works
                </button>
                <button
                  type="button"
                  onClick={() => goToSection('features')}
                  className="text-sm font-semibold text-deep-teal/70 hover:text-deep-teal transition-colors cursor-pointer"
                >
                  Capabilities
                </button>
                <button
                  type="button"
                  onClick={() => goToSection('preview')}
                  className="text-sm font-semibold text-deep-teal/70 hover:text-deep-teal transition-colors cursor-pointer"
                >
                  Preview
                </button>
              </>
            )}
          </nav>

          {/* Right Controls: Accessibility + Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Accessibility Toggles: Contrast & Text Size */}
            <div
              className="flex items-center border border-deep-teal/15 bg-surface rounded-sm p-0.5"
              role="group"
              aria-label="Accessibility controls"
            >
              <button
                type="button"
                onClick={toggleHighContrast}
                aria-pressed={highContrast}
                aria-label="Toggle High Contrast Mode"
                title="Toggle High Contrast Mode"
                className={`flex h-8 px-2.5 items-center gap-1.5 rounded-xs text-xs font-bold transition-colors cursor-pointer ${
                  highContrast
                    ? 'bg-yellow-400 text-black shadow-xs ring-1 ring-black'
                    : 'text-deep-teal/75 hover:bg-white hover:text-deep-teal'
                }`}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">Contrast</span>
              </button>

              <button
                type="button"
                onClick={toggleLargeText}
                aria-pressed={largeText}
                aria-label="Toggle Large Text Size"
                title="Toggle Large Text Size"
                className={`flex h-8 px-2.5 items-center gap-1.5 rounded-xs text-xs font-bold transition-colors cursor-pointer ${
                  largeText
                    ? 'bg-deep-teal text-white shadow-xs'
                    : 'text-deep-teal/75 hover:bg-white hover:text-deep-teal'
                }`}
              >
                <Type className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">Text Size</span>
              </button>
            </div>

            {/* Auth Actions */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-deep-teal/15">
                <span
                  className="inline-flex items-center gap-2 text-xs font-semibold text-deep-teal/80 bg-deep-teal/5 px-2.5 py-1.5 rounded-sm"
                  title={user.email}
                >
                  <UserIcon className="h-3.5 w-3.5 text-bright-cyan" aria-hidden="true" />
                  <span className="max-w-[120px] truncate">{user.name?.split(' ')[0]}</span>
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-deep-teal/60 hover:text-terracotta hover:bg-terracotta/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-deep-teal/15">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-deep-teal/80 hover:text-deep-teal px-3 py-2 rounded-sm transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary px-4 py-2 text-xs sm:text-sm font-bold shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-sm border border-deep-teal/15 text-deep-teal hover:bg-deep-teal/5 transition-colors cursor-pointer"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-deep-teal/10 py-4 pb-6 space-y-3 bg-white shadow-lg animate-rise">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 mb-2 bg-deep-teal/5 rounded-sm flex items-center gap-2 text-sm font-semibold text-deep-teal">
                  <UserIcon className="h-4 w-4 text-bright-cyan" />
                  <span>{user.name}</span>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-semibold text-deep-teal hover:bg-deep-teal/5"
                >
                  <LayoutDashboard className="h-4 w-4 text-deep-teal/70" />
                  <span>Workspace Dashboard</span>
                </Link>
                <Link
                  to="/upload"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-semibold text-deep-teal hover:bg-deep-teal/5"
                >
                  <UploadCloud className="h-4 w-4 text-bright-cyan" />
                  <span>Upload Document</span>
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-semibold text-deep-teal hover:bg-deep-teal/5"
                >
                  <History className="h-4 w-4 text-deep-teal/70" />
                  <span>Document History</span>
                </Link>
                <div className="pt-2 border-t border-deep-teal/10">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-semibold text-terracotta hover:bg-terracotta/10 text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => goToSection('how-it-works')}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-deep-teal hover:bg-deep-teal/5 rounded-sm"
                >
                  How it works
                </button>
                <button
                  type="button"
                  onClick={() => goToSection('features')}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-deep-teal hover:bg-deep-teal/5 rounded-sm"
                >
                  Capabilities
                </button>
                <button
                  type="button"
                  onClick={() => goToSection('preview')}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-deep-teal hover:bg-deep-teal/5 rounded-sm"
                >
                  Document Preview
                </button>
                <div className="pt-3 border-t border-deep-teal/10 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-semibold border border-deep-teal/20 rounded-sm text-deep-teal hover:bg-deep-teal/5"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn btn-primary w-full py-2.5 text-sm font-bold text-center"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
