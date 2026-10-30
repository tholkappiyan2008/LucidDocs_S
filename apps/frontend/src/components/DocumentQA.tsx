import React, { useState, useEffect, useRef } from 'react';
import {
  askDocumentQuestion,
  getDocumentQuestions,
  DocumentQuestion,
} from '../services/document.service';
import { SupportedLanguage } from '../context/A11yContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  RefreshCw,
  User,
  Bot,
} from 'lucide-react';

interface DocumentQAProps {
  documentId: string;
  language: SupportedLanguage;
}

export const DocumentQA: React.FC<DocumentQAProps> = ({ documentId, language }) => {
  const [questions, setQuestions] = useState<DocumentQuestion[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { play } = useSpeechSynthesis(language);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions tailored by language
  const suggestedQuestions: Record<string, string[]> = {
    en: [
      'What is the total amount I need to pay?',
      'When is the deadline?',
      'What happens if I miss this deadline?',
      'Why did I receive this notice?',
    ],
    ta: [
      'நான் செலுத்த வேண்டிய மொத்த தொகை எவ்வளவு?',
      'கடைசி நாள் எப்போது?',
      'கட்டணத்தை தாமதப்படுத்தினால் என்ன நடக்கும்?',
    ],
    te: [
      'నేను చెల్లించాల్సిన మొత్తం ఎంత?',
      'చివరి తేదీ ఎప్పుడు?',
      'గడువు తప్పితే ఏమవుతుంది?',
    ],
    hi: [
      'मुझे कुल कितनी राशि का भुगतान करना है?',
      'अंतिम तिथि क्या है?',
      'यदि मैं समय पर भुगतान न करूं तो क्या होगा?',
    ],
  };

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoadingHistory(true);
        setError(null);
        const res = await getDocumentQuestions(documentId);
        if (res && res.questions) {
          setQuestions(res.questions);
        }
      } catch (err: any) {
        console.warn('Failed to load past Q&A history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    if (documentId) {
      loadHistory();
    }
  }, [documentId]);

  useEffect(() => {
    // Scroll to bottom when questions change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questions, asking]);

  const handleAsk = async (questionToAsk?: string) => {
    const q = (questionToAsk || inputText).trim();
    if (!q || asking) return;

    try {
      setAsking(true);
      setError(null);
      setInputText('');

      const res = await askDocumentQuestion(documentId, q, language);
      if (res && res.question) {
        setQuestions((prev) => [...prev, res.question]);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Could not generate an answer. Please verify backend environment configuration.';
      setError(msg);
    } finally {
      setAsking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ask Questions About This Document</h2>
            <p className="text-xs text-slate-500">
              Answers are strictly grounded in your document without hallucinating missing facts
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full w-fit">
          AI Document Grounded
        </span>
      </div>

      {/* Suggested Quick Question Pills */}
      <div className="mb-6">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Suggested Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {(suggestedQuestions[language] || suggestedQuestions.en).map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(sq)}
              disabled={asking}
              className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 transition-colors text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread Box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6 max-h-[480px] overflow-y-auto space-y-4">
        {loadingHistory ? (
          <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading question history...</span>
          </div>
        ) : questions.length === 0 && !asking ? (
          <div className="py-12 text-center text-slate-400">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No questions asked yet.</p>
            <p className="text-xs mt-1">Ask anything about amounts, due dates, or confusing terms.</p>
          </div>
        ) : (
          questions.map((item) => (
            <div key={item.id} className="space-y-3">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[75%]">
                  <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-sm text-sm sm:text-base font-medium">
                    {item.question}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* ClearDoc AI Answer */}
              <div className="flex justify-start">
                <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[80%]">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed">
                    <p className="whitespace-pre-line">{item.answer}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {/* Grounding badge */}
                      {item.is_grounded ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Grounded in Document</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Not Found in Document</span>
                        </span>
                      )}

                      {/* Read aloud answer button */}
                      <button
                        type="button"
                        onClick={() => play(item.answer, language)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors p-1"
                        title="Read answer aloud"
                        aria-label="Read answer aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Asking Spinner Bubble */}
        {asking && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-200 text-sm text-slate-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span>ClearDoc is reviewing your document to answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center justify-between" role="alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleAsk()}
            className="inline-flex items-center gap-1 font-bold text-rose-900 underline ml-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Question Input Form */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this document (e.g., 'What happens if I miss the due date?')..."
          disabled={asking}
          maxLength={1000}
          className="w-full pl-4 pr-24 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm sm:text-base bg-white shadow-inner"
          aria-label="Ask a question about this document"
        />

        <button
          type="button"
          onClick={() => handleAsk()}
          disabled={!inputText.trim() || asking}
          className="absolute right-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 shadow"
          aria-label="Submit question"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Press Enter to send</span>
        <span>{inputText.length} / 1000</span>
      </div>
    </div>
  );
};
