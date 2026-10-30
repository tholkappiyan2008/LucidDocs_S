import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Volume2,
  Languages,
  ShieldCheck,
  Calendar,
  MessageSquare,
  ArrowRight,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-6">
            <HeartHandshake className="w-4 h-4" />
            <span>AI for Accessibility & Digital Inclusion</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight">
            Understand Complex Documents{' '}
            <span className="text-emerald-600 underline decoration-emerald-300">Without Fear</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Medical bills, legal letters, and government notices can be overwhelming.
            <strong className="text-slate-800 font-semibold"> ClearDoc </strong>
            turns complex paperwork into simple explanations, audio read-aloud, and actionable guidance in English, Tamil, and Hindi.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <span>{user ? 'Go to Dashboard' : 'Get Started — It’s Free'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to={user ? '/upload' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-lg px-8 py-4 rounded-2xl border-2 border-slate-300 shadow-sm transition-all"
            >
              <span>Upload a Document</span>
            </Link>
          </div>

          {/* Accessibility Trust Badges */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium">Plain 5th-Grade Language</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium">Browser Voice Read-Aloud</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium">Tamil & Hindi Translation</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium">100% In-Memory Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Built for Everyone, Regardless of Literacy or Vision</h2>
            <p className="mt-2 text-slate-600">Six essential accessibility capabilities powered by Multimodal AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Multimodal Document OCR</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Upload clear scans, phone photos, or multi-page PDFs. ClearDoc extracts key facts, amounts, and dates without storing original files to disk.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Voice Read-Aloud</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Listen to summaries and deadlines read clearly aloud using browser speech synthesis with play, pause, resume, and speed controls.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Languages className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Tamil & Hindi Native Support</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Break language barriers by viewing document breakdowns translated into your primary language while preserving dates and rupee values safely.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Grounded Follow-up Q&A</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ask questions like "When is the cut-off date?" or "How much do I owe?". Answers are strictly grounded in your document without hallucination.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Risk & Verification Warnings</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Clear severity badges highlight overdue risks, penalties, and blurriness requiring human verification before you make financial decisions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">One-Click Calendar Reminders</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Export standard .ics reminders for bills, hospital appointments, or court dates straight into Google Calendar, Apple, or Outlook.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

