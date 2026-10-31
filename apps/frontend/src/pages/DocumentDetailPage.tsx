import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getDocumentById, DocumentRecord } from '../services/document.service';
import { useA11y } from '../context/A11yContext';
import { AudioPlayer } from '../components/AudioPlayer';
import { DocumentQA } from '../components/DocumentQA';
import {
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Clock,
  Info,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { language: activeLang } = useA11y();

  const [document, setDocument] = useState<DocumentRecord | null>(() => {
    return location.state?.document || null;
  });

  const [activeAnalysis, setActiveAnalysis] = useState<DocumentRecord['analysis'] | null>(() => {
    return location.state?.document?.analysis || null;
  });

  const [loading, setLoading] = useState<boolean>(!location.state?.document);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoc() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await getDocumentById(id);
        if (res && res.document) {
          setDocument(res.document);
          setActiveAnalysis(res.document.analysis);
        } else {
          setError('Document could not be found.');
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.error?.message ||
          'Could not retrieve document analysis. Please check your network and session.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    if (!document) {
      fetchDoc();
    }
  }, [id, document]);

  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'bg-terracotta text-white font-bold';
      case 'high':
        return 'bg-terracotta/15 text-terracotta border border-terracotta/30 font-bold';
      case 'medium':
        return 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold';
      default:
        return 'bg-ocean-teal/10 text-ocean-teal border border-ocean-teal/20 font-semibold';
    }
  };

  const labelClass = 'text-xs font-bold uppercase tracking-[0.18em] text-deep-teal/65';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6" role="status">
        <span className="h-10 w-10 animate-spin rounded-full border-3 border-deep-teal border-t-transparent" />
        <h1 className="mt-5 text-xl font-bold tracking-tight text-deep-teal">
          Loading document analysis…
        </h1>
        <p className="mt-1 text-sm text-deep-teal/65">
          Retrieving verified facts and deadlines from your account
        </p>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-deep-teal">
          Document analysis unavailable
        </h1>
        <p className="mt-3 text-base leading-relaxed text-deep-teal/70">{error}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-quiet py-3"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry</span>
          </button>
          <Link to="/dashboard" className="btn btn-primary px-6 py-3 font-bold">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!document || !activeAnalysis) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
      {/* Navigation Toolbar */}
      <div className="flex flex-col gap-4 border-b border-deep-teal/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard"
          className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-deep-teal/70 hover:text-deep-teal transition-colors"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span>Back to workspace</span>
        </Link>

        <span className="text-xs font-semibold text-deep-teal/60">
          In-Memory Verified Analysis · English V1
        </span>
      </div>

      {/* Document Header */}
      <header className="mt-8 border-b border-deep-teal/10 pb-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
          <span className="rounded-xs bg-ocean-teal/10 px-2.5 py-1 uppercase tracking-wider text-ocean-teal font-bold">
            {activeAnalysis.doc_type || document.doc_type || 'Document'}
          </span>
          <span className="flex items-center gap-1.5 text-deep-teal/75 bg-white border border-deep-teal/10 px-2.5 py-1 rounded-xs">
            <Building className="h-3.5 w-3.5 text-deep-teal/50" aria-hidden="true" />
            <span>
              From <strong className="font-bold text-deep-teal">{activeAnalysis.sender || document.sender || 'Unknown Sender'}</strong>
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-deep-teal/60 sm:ml-auto">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Analyzed on {new Date(document.created_at).toLocaleDateString()}</span>
          </span>
        </div>

        <h1 className="mt-4 break-words text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-deep-teal">
          {document.file_name}
        </h1>
      </header>

      {/* Audio Player Component */}
      <div className="mt-8">
        <AudioPlayer analysis={activeAnalysis} language={activeLang} />
      </div>

      {/* Human Verification Warning if present */}
      {activeAnalysis.needs_human_check && activeAnalysis.needs_human_check.length > 0 && (
        <section
          className="mt-8 rounded-sm border-l-4 border-terracotta bg-terracotta/10 p-5 sm:p-6 text-deep-teal shadow-xs"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-deep-teal sm:text-lg">
                Requires human verification
              </h2>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-deep-teal/80">
                The AI identified items that should be confirmed by a professional (doctor, attorney
                or billing clerk) before taking final financial or legal action:
              </p>
              <ul className="mt-3 space-y-1.5">
                {activeAnalysis.needs_human_check.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Summary and Details Grid */}
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Plain-Language Summary, Facts, Next Steps */}
        <section className="lg:col-span-7 min-w-0 space-y-10">
          {/* Summary Box */}
          <div className="panel p-5 sm:p-8 bg-white border border-deep-teal/10 rounded-sm shadow-xs">
            <div className="flex items-center justify-between border-b border-deep-teal/10 pb-3">
              <h2 className={labelClass}>Plain-language summary</h2>
              <span className="rounded-xs bg-bright-cyan/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-bright-cyan">
                5th-grade clarity
              </span>
            </div>
            <p className="mt-5 whitespace-pre-line text-base sm:text-lg leading-[1.75] text-deep-teal/90">
              {activeAnalysis.plain_summary}
            </p>
          </div>

          {/* Key Facts & Amounts */}
          <div>
            <div className="flex items-center gap-2 border-b border-deep-teal/10 pb-3">
              <Info className="h-4 w-4 text-ocean-teal" aria-hidden="true" />
              <h2 className={labelClass}>Important facts &amp; amounts</h2>
            </div>

            {activeAnalysis.key_facts && activeAnalysis.key_facts.length > 0 ? (
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeAnalysis.key_facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="panel p-4 bg-white border border-deep-teal/10 rounded-sm shadow-xs flex flex-col justify-between min-w-0 overflow-hidden"
                  >
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-deep-teal/60">
                        {fact.label}
                      </dt>
                      <dd className="mt-2 break-words text-lg sm:text-xl font-extrabold text-deep-teal">
                        {fact.value}
                      </dd>
                    </div>
                    <p className="mt-3 text-[0.6875rem] font-semibold text-deep-teal/50">
                      Extraction Confidence {(fact.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="py-4 text-sm text-deep-teal/60">No structured metrics extracted.</p>
            )}
          </div>

          {/* Recommended Next Steps */}
          <div>
            <div className="flex items-center gap-2 border-b border-deep-teal/10 pb-3">
              <CheckCircle className="h-4 w-4 text-bright-cyan" aria-hidden="true" />
              <h2 className={labelClass}>Recommended next steps</h2>
            </div>

            {activeAnalysis.next_steps && activeAnalysis.next_steps.length > 0 ? (
              <ol className="mt-4 space-y-3">
                {activeAnalysis.next_steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3.5 panel p-4 bg-white border border-deep-teal/10 rounded-sm shadow-xs"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-deep-teal text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-sm sm:text-base leading-relaxed text-deep-teal/85">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-4 text-sm text-deep-teal/60">No immediate actions required.</p>
            )}
          </div>
        </section>

        {/* Right Column: Deadlines, Key Dates & Risk Assessment */}
        <aside className="lg:col-span-5 min-w-0 space-y-10">
          {/* Deadlines Panel */}
          <div className="panel p-5 sm:p-6 bg-white border border-deep-teal/10 rounded-sm shadow-xs">
            <div className="flex items-center gap-2 border-b border-deep-teal/10 pb-3">
              <Calendar className="h-4 w-4 text-terracotta" aria-hidden="true" />
              <h2 className={labelClass}>Deadlines &amp; key dates</h2>
            </div>

            {activeAnalysis.deadlines && activeAnalysis.deadlines.length > 0 ? (
              <ul className="mt-4 divide-y divide-deep-teal/10">
                {activeAnalysis.deadlines.map((dl, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-deep-teal break-words">{dl.what}</p>
                      <p className="mt-1 text-sm font-semibold text-terracotta">{dl.date}</p>
                    </div>
                    <span className="rounded-xs border border-deep-teal/15 bg-surface px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-deep-teal/70 shrink-0">
                      Due
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-deep-teal/60">No specific deadlines detected.</p>
            )}
          </div>

          {/* Risk Assessment Panel */}
          <div className="panel p-5 sm:p-6 bg-white border border-deep-teal/10 rounded-sm shadow-xs">
            <div className="flex items-center gap-2 border-b border-deep-teal/10 pb-3">
              <AlertTriangle className="h-4 w-4 text-terracotta" aria-hidden="true" />
              <h2 className={labelClass}>Risk assessment</h2>
            </div>

            {activeAnalysis.risks && activeAnalysis.risks.length > 0 ? (
              <ul className="mt-4 divide-y divide-deep-teal/10">
                {activeAnalysis.risks.map((risk, idx) => (
                  <li key={idx} className="py-3.5 space-y-1.5">
                    <span
                      className={`inline-block rounded-xs px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${getRiskBadge(
                        risk.level
                      )}`}
                    >
                      {risk.level} risk
                    </span>
                    <p className="text-sm leading-relaxed text-deep-teal/80">{risk.note}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-sm border-l-4 border-ocean-teal bg-ocean-teal/5 p-4 text-xs text-deep-teal/80">
                No significant risks or penalties detected in this document.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Follow-up Document Q&A Component */}
      <DocumentQA documentId={document.id} language={activeLang} />
    </div>
  );
};

export default DocumentDetailPage;
