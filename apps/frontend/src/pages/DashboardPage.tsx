import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useA11y } from '../context/A11yContext';
import { getDocuments, DocumentListItem } from '../services/document.service';
import {
  ArrowRight,
  UploadCloud,
  Eye,
  Type,
  Volume2,
  FileText,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Reveal } from '../components/Reveal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { highContrast, toggleHighContrast, largeText, toggleLargeText } = useA11y();

  const [recent, setRecent] = useState<DocumentListItem[]>([]);
  const [recentState, setRecentState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadRecent() {
      try {
        setRecentState('loading');
        const res = await getDocuments(1, 5);
        if (cancelled) return;
        setRecent(res.documents ?? []);
        setRecentState('ready');
      } catch {
        if (!cancelled) setRecentState('error');
      }
    }

    loadRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  const sectionHeading = 'text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-deep-teal/60';

  return (
    <div className="shell py-10 sm:py-14 lg:py-16">
      {/* Workspace Header */}
      <Reveal>
        <div className="flex flex-col gap-6 border-b border-deep-teal/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-sm bg-bright-cyan/10 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-bright-cyan border border-bright-cyan/20">
              <span className="h-1.5 w-1.5 rounded-full bg-bright-cyan" />
              <span>Workspace</span>
            </div>
            <h1 className="mt-4 text-[clamp(2rem,3.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-deep-teal">
              Welcome back, {user?.name?.split(' ')[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-deep-teal/70">
              What would you like to understand today? Upload an image or PDF for an instant,
              plain-language breakdown.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/upload" className="btn btn-primary px-6 py-3.5 font-bold shadow-xs">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              <span>Upload Document</span>
            </Link>
            <Link to="/history" className="btn btn-quiet py-3.5">
              <span>Document History</span>
            </Link>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-10">
          {/* Upload Invitation Hero Card */}
          <Reveal>
            <Link
              to="/upload"
              className="group relative flex flex-col gap-6 overflow-hidden rounded-sm bg-deep-teal p-6 text-white shadow-sm transition-all duration-300 hover:shadow-md sm:flex-row sm:items-center sm:p-8"
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 10% 20%, rgba(15,164,175,0.22), transparent 45%), radial-gradient(circle at 90% 80%, rgba(150,71,52,0.18), transparent 45%)',
                }}
              />
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-bright-cyan text-deep-teal transition-transform group-hover:scale-105">
                <UploadCloud className="h-7 w-7" aria-hidden="true" />
              </span>
              <span className="relative z-10 flex-1">
                <span className="block text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Analyze a new document
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-white/75">
                  Bills, hospital discharge summaries, bank letters and notices — processed in
                  memory, explained in plain language with key facts & deadlines.
                </span>
              </span>
              <span className="relative z-10 flex items-center gap-2 text-sm font-bold text-bright-cyan transition-transform group-hover:translate-x-1">
                <span>Start analysis</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </Reveal>

          {/* Recent Documents Section */}
          <div>
            <div className="flex items-baseline justify-between border-b border-deep-teal/10 pb-3">
              <h2 className={sectionHeading}>Recent documents</h2>
              <Link
                to="/history"
                className="text-xs sm:text-sm font-semibold text-deep-teal/70 hover:text-bright-cyan transition-colors"
              >
                View all history →
              </Link>
            </div>

            {recentState === 'loading' && (
              <div role="status" className="py-6 space-y-4">
                <span className="sr-only">Loading recent documents</span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-sm border border-deep-teal/10 bg-white p-4"
                  >
                    <span className="h-4 w-20 animate-pulse rounded-xs bg-deep-teal/10" />
                    <span className="h-4 flex-1 animate-pulse rounded-xs bg-deep-teal/10" />
                    <span className="h-4 w-24 animate-pulse rounded-xs bg-deep-teal/10" />
                  </div>
                ))}
              </div>
            )}

            {recentState === 'error' && (
              <div className="py-8 text-center rounded-sm border border-deep-teal/10 bg-white p-6">
                <p className="text-sm text-deep-teal/70">
                  Recent documents are unavailable right now.{' '}
                  <Link
                    to="/history"
                    className="font-semibold text-deep-teal underline underline-offset-4"
                  >
                    Open Document History
                  </Link>{' '}
                  to view all.
                </p>
              </div>
            )}

            {recentState === 'ready' && recent.length === 0 && (
              <div className="py-12 text-center rounded-sm border border-dashed border-deep-teal/20 bg-white p-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-deep-teal/5 text-deep-teal/60 mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-base font-bold text-deep-teal">No documents analyzed yet.</p>
                <p className="mt-1 text-sm text-deep-teal/65 max-w-sm mx-auto">
                  Upload your first electricity bill, hospital report, or government notice to see
                  plain-language summaries and deadline alerts.
                </p>
                <Link to="/upload" className="btn btn-primary mt-6 inline-flex">
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload your first document</span>
                </Link>
              </div>
            )}

            {recentState === 'ready' && recent.length > 0 && (
              <div className="mt-4 divide-y divide-deep-teal/10 rounded-sm border border-deep-teal/10 bg-white shadow-xs">
                {recent.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="group flex flex-col gap-2 p-4 transition-colors hover:bg-deep-teal/3 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                  >
                    <div className="flex items-center gap-2 sm:w-1/4">
                      <span className="rounded-xs bg-ocean-teal/10 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-ocean-teal">
                        {doc.doc_type || 'Document'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate text-base font-bold text-deep-teal group-hover:text-ocean-teal transition-colors">
                        {doc.file_name}
                      </div>
                      <p className="line-clamp-1 text-xs text-deep-teal/65 mt-0.5">
                        {doc.plain_summary || 'Analysis ready to view.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-deep-teal/60 sm:w-auto shrink-0">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-bright-cyan transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Rail: Accessibility & Workspace Info */}
        <aside className="lg:col-span-4 space-y-6">
          <Reveal delay={0.08}>
            <div className="panel p-6 space-y-6">
              <h2 className={sectionHeading}>Accessibility preferences</h2>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={toggleHighContrast}
                  aria-pressed={highContrast}
                  className={`flex items-center justify-between gap-3 border px-4 py-3 rounded-sm text-sm font-semibold transition-colors cursor-pointer ${
                    highContrast
                      ? 'border-black bg-yellow-400 text-black shadow-xs font-bold'
                      : 'border-deep-teal/15 bg-surface text-deep-teal hover:border-bright-cyan'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-deep-teal" aria-hidden="true" />
                    <span>High contrast mode</span>
                  </span>
                  <span className="text-xs uppercase tracking-wider opacity-75">
                    {highContrast ? 'Active' : 'Off'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleLargeText}
                  aria-pressed={largeText}
                  className={`flex items-center justify-between gap-3 border px-4 py-3 rounded-sm text-sm font-semibold transition-colors cursor-pointer ${
                    largeText
                      ? 'border-deep-teal bg-deep-teal text-white shadow-xs font-bold'
                      : 'border-deep-teal/15 bg-surface text-deep-teal hover:border-bright-cyan'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Type className="h-4 w-4" aria-hidden="true" />
                    <span>Larger typography</span>
                  </span>
                  <span className="text-xs uppercase tracking-wider opacity-75">
                    {largeText ? '118%' : 'Standard'}
                  </span>
                </button>
              </div>

              <div className="border-t border-deep-teal/10 pt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-bright-cyan" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-deep-teal/70">
                    <strong className="text-deep-teal font-semibold">Audio Read-Aloud:</strong>{' '}
                    Open any analyzed document and use the audio controls to listen to summaries and
                    dates via browser speech synthesis.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-bright-cyan" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-deep-teal/70">
                    <strong className="text-deep-teal font-semibold">100% In-Memory Privacy:</strong>{' '}
                    Documents are analyzed in volatile memory without raw storage. Analysis records
                    are isolated to your account.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-bright-cyan" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-deep-teal/70">
                    <strong className="text-deep-teal font-semibold">Follow-up Q&A:</strong> Ask
                    specific questions on deadlines or amounts grounded directly in your document.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
