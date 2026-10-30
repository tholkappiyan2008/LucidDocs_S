import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getDocumentById, translateDocument, DocumentRecord } from '../services/document.service';
import { useA11y, SupportedLanguage } from '../context/A11yContext';
import { AudioPlayer } from '../components/AudioPlayer';
import {
  FileText,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Languages,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { language: globalLanguage, setLanguage: setGlobalLanguage } = useA11y();

  const [document, setDocument] = useState<DocumentRecord | null>(() => {
    // Check if document was passed via navigation state from UploadPage
    return location.state?.document || null;
  });

  const [activeAnalysis, setActiveAnalysis] = useState<DocumentRecord['analysis'] | null>(() => {
    return location.state?.document?.analysis || null;
  });

  const [activeLang, setActiveLang] = useState<SupportedLanguage>(globalLanguage);
  const [loading, setLoading] = useState<boolean>(!location.state?.document);
  const [translating, setTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [translationNotice, setTranslationNotice] = useState<string | null>(null);

  // Fetch document if not pre-populated from navigation
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
          'Failed to load document analysis. Please ensure you are logged in.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    if (!document && id) {
      fetchDoc();
    }
  }, [id, document]);

  // Handle on-demand translation (Module 5)
  const handleLanguageChange = async (targetLang: SupportedLanguage) => {
    if (!id || !document) return;
    setActiveLang(targetLang);
    setGlobalLanguage(targetLang);

    if (targetLang === 'en') {
      setActiveAnalysis(document.analysis);
      setTranslationNotice(null);
      return;
    }

    try {
      setTranslating(true);
      setError(null);
      setTranslationNotice(`Translating document into ${getLanguageLabel(targetLang)}...`);

      const res = await translateDocument(id, targetLang);
      if (res && res.analysis) {
        setActiveAnalysis(res.analysis);
        setTranslationNotice(
          `Showing explanation in ${getLanguageLabel(targetLang)}. Original amounts, dates, and account numbers are strictly preserved.`
        );
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        `Translation into ${getLanguageLabel(targetLang)} failed. Reverting to original explanation.`;
      setError(msg);
      setActiveAnalysis(document.analysis);
      setActiveLang('en');
    } finally {
      setTranslating(false);
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'ta':
        return 'தமிழ் (Tamil)';
      case 'te':
        return 'తెలుగు (Telugu)';
      case 'hi':
        return 'हिंदी (Hindi)';
      default:
        return 'English';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'bg-rose-600 text-white border-rose-700';
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800">Loading Document Analysis...</h2>
        <p className="text-slate-500 text-sm mt-1">Retrieving verified facts and deadlines from database</p>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Document Analysis Unavailable</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!document || !activeAnalysis) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm w-fit focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Language Selection Toolbar (Module 5) */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Languages className="w-5 h-5 text-emerald-600 ml-2" />
          <span className="text-xs sm:text-sm font-bold text-slate-700">Language:</span>
          <div className="flex gap-1">
            {(['en', 'ta', 'te', 'hi'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                disabled={translating}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeLang === lang
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                aria-pressed={activeLang === lang}
              >
                {lang === 'en' && 'English'}
                {lang === 'ta' && 'தமிழ்'}
                {lang === 'te' && 'తెలుగు'}
                {lang === 'hi' && 'हिंदी'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Translating Spinner State */}
      {translating && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">
            Generating simplified translation with Gemini AI... Please wait.
          </span>
        </div>
      )}

      {/* Translation Notice Banner */}
      {translationNotice && !translating && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Multilingual View Active: </span>
            {translationNotice}
          </div>
        </div>
      )}

      {/* Document Overview Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
            {activeAnalysis.doc_type || document.doc_type}
          </span>
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium">
            <Building className="w-4 h-4 text-slate-400" />
            <span>Sender: <strong>{activeAnalysis.sender || document.sender}</strong></span>
          </span>
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 font-medium ml-auto">
            <Clock className="w-4 h-4" />
            <span>{new Date(document.created_at).toLocaleDateString()}</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {document.file_name}
        </h1>
      </div>

      {/* Module 6: Voice Read-Aloud Audio Player */}
      <AudioPlayer analysis={activeAnalysis} language={activeLang} />

      {/* Human Verification Warning Box (Module 4 Req 7) */}
      {activeAnalysis.needs_human_check && activeAnalysis.needs_human_check.length > 0 && (
        <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl" role="alert">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-amber-900">
                Action Requires Human Verification
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                The AI identified items that should be confirmed by a professional (doctor, attorney, or official agent):
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-amber-950 font-medium list-disc list-inside">
                {activeAnalysis.needs_human_check.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Plain-Language Summary + Key Facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Card 1: Plain-Language Summary (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Plain-Language Summary</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              5th-Grade Reading Level
            </span>
          </div>

          <p className="text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line">
            {activeAnalysis.plain_summary}
          </p>
        </div>

        {/* Card 2: Risk Level Indicators */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Risk Assessment</h2>
          </div>

          {activeAnalysis.risks && activeAnalysis.risks.length > 0 ? (
            <div className="space-y-3">
              {activeAnalysis.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${getRiskBadge(
                        risk.level
                      )}`}
                    >
                      {risk.level} Risk
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 pt-1 leading-normal">{risk.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm">
              No significant risks or penalties detected in this document.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Key Facts & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Card 3: Key Facts & Amounts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Important Facts & Amounts</h2>
          </div>

          {activeAnalysis.key_facts && activeAnalysis.key_facts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeAnalysis.key_facts.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {fact.label}
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 mt-1 break-words">
                    {fact.value}
                  </span>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Confidence: {(fact.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No structured metrics extracted.</p>
          )}
        </div>

        {/* Card 4: Deadlines & Important Dates */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Deadlines & Key Dates</h2>
          </div>

          {activeAnalysis.deadlines && activeAnalysis.deadlines.length > 0 ? (
            <div className="space-y-3">
              {activeAnalysis.deadlines.map((dl, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{dl.what}</h4>
                    <span className="text-xs text-amber-800 font-semibold">{dl.date}</span>
                  </div>
                  <span className="px-3 py-1 bg-white text-slate-800 text-xs font-bold rounded-xl border border-amber-300 shadow-sm">
                    Due Date
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No specific deadlines detected in document.</p>
          )}
        </div>
      </div>

      {/* Card 5: Actionable Next Steps */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Recommended Next Steps</h2>
        </div>

        {activeAnalysis.next_steps && activeAnalysis.next_steps.length > 0 ? (
          <ol className="space-y-3">
            {activeAnalysis.next_steps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-slate-500 text-sm">No immediate actions required.</p>
        )}
      </div>
    </div>
  );
};
