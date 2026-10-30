import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useA11y, SupportedLanguage } from '../context/A11yContext';
import {
  FileText,
  Eye,
  Type,
  Globe,
  LogOut,
  User as UserIcon,
  PlusCircle,
  Clock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { highContrast, toggleHighContrast, largeText, toggleLargeText, language, setLanguage } =
    useA11y();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
            aria-label="ClearDoc Home"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">ClearDoc</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                Accessible AI
              </span>
            </div>
          </Link>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Accessibility Toolbar */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              {/* High Contrast Toggle */}
              <button
                type="button"
                onClick={toggleHighContrast}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-emerald-500 ${
                  highContrast
                    ? 'bg-yellow-400 text-black font-bold ring-2 ring-yellow-500'
                    : 'text-slate-700 hover:bg-white'
                }`}
                aria-pressed={highContrast}
                title="Toggle High Contrast Mode"
                aria-label="Toggle High Contrast Mode"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden md:inline">Contrast</span>
              </button>

              {/* Large Text Toggle */}
              <button
                type="button"
                onClick={toggleLargeText}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-emerald-500 ${
                  largeText
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-700 hover:bg-white'
                }`}
                aria-pressed={largeText}
                title="Toggle Large Text Mode"
                aria-label="Toggle Large Text Mode"
              >
                <Type className="w-4 h-4" />
                <span className="hidden md:inline">Text Size</span>
              </button>

              {/* Language Selector */}
              <div className="relative flex items-center ml-1 border-l border-slate-300 pl-1">
                <Globe className="w-4 h-4 text-slate-500 ml-1 hidden sm:block" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-slate-800 py-1 px-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded cursor-pointer"
                  aria-label="Select explanation language"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>

            {/* Auth Actions */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/upload"
                  className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload Doc</span>
                </Link>

                <Link
                  to="/history"
                  className="hidden sm:inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 text-sm font-medium px-2 py-2 rounded-lg"
                  title="Document History"
                >
                  <Clock className="w-4 h-4" />
                  <span>History</span>
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                    title={user.email}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="hidden lg:inline">{user.name.split(' ')[0]}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:ring-2 focus:ring-rose-500"
                    title="Log Out"
                    aria-label="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
