import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useA11y } from '../context/A11yContext';
import {
  UploadCloud,
  Clock,
  Volume2,
  Eye,
  Type,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useA11y();

  const greetings: Record<string, string> = {
    en: 'Welcome back',
    ta: 'வணக்கம் (Vanakkam)',
    hi: 'नमस्ते (Namaste)',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-10">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-3">
            ClearDoc Accessibility Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {greetings[language] || greetings.en}, {user?.name}!
          </h1>
          <p className="mt-3 text-emerald-100 text-base sm:text-lg leading-relaxed">
            What document would you like to understand today? Upload an image or PDF to get an instant, plain-language breakdown.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all text-base focus:ring-2 focus:ring-white"
            >
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <span>Upload New Document</span>
            </Link>

            <Link
              to="/history"
              className="inline-flex items-center gap-2 bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold px-6 py-3.5 rounded-2xl border border-emerald-400/30 transition-all text-base focus:ring-2 focus:ring-white"
            >
              <Clock className="w-5 h-5 text-emerald-200" />
              <span>Past Documents</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Upload Card */}
        <Link
          to="/upload"
          className="group block p-8 bg-white rounded-3xl border-2 border-emerald-200 hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">
              Fast & Private
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Scan & Analyze Document
          </h2>
          <p className="text-slate-600 mt-2 text-base leading-relaxed">
            Upload electricity bills, hospital discharge summaries, bank statements, or legal notices. Processed completely in-memory with Gemini.
          </p>
          <div className="mt-6 flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <span>Start document scan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* History Card */}
        <Link
          to="/history"
          className="group block p-8 bg-white rounded-3xl border-2 border-slate-200 hover:border-slate-400 shadow-sm hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase">
              Saved Archives
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
            Document History
          </h2>
          <p className="text-slate-600 mt-2 text-base leading-relaxed">
            Review your previously analyzed documents, check deadlines, review AI summaries, or ask follow-up questions at any time.
          </p>
          <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm">
            <span>View previous documents</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Accessibility Guidance Box */}
      <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          <span>Accessibility Features at Your Fingertips</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
              <Eye className="w-4 h-4" />
              <span>High Contrast</span>
            </div>
            <p className="text-xs text-slate-600">
              Click the Contrast button in the top navigation bar to switch to maximum-contrast black/yellow mode for better visibility.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
              <Type className="w-4 h-4" />
              <span>Large Text</span>
            </div>
            <p className="text-xs text-slate-600">
              Toggle Text Size anytime to enlarge words, buttons, and badges by 120% for comfortable reading.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
              <Volume2 className="w-4 h-4" />
              <span>Read Aloud</span>
            </div>
            <p className="text-xs text-slate-600">
              Once an analysis loads, use the Read Aloud audio player to listen to plain-language summaries and deadline alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
