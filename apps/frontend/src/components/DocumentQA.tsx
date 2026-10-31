import React, { useState, useEffect, useRef } from 'react';
import {
  askDocumentQuestion,
  getDocumentQuestions,
  DocumentQuestion,
} from '../services/document.service';
import { SupportedLanguage } from '../context/A11yContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  User,
  Sparkles,
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

  const suggestedQuestions = [
    'What is the total amount I need to pay?',
    'When is the deadline?',
    'What happens if I miss this deadline?',
    'Why did I receive this document?',
    'Are there any penalties or late fees?',
  ];

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
    <section className="mt-12 rounded-sm border border-deep-teal/15 bg-white p-4 sm:p-8 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-deep-teal/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bright-cyan mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Grounded Document Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-deep-teal">
            Ask Questions About This Document
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-deep-teal/70">
            Answers are strictly grounded in your verified document content without hallucination.
          </p>
        </div> 
      </div>

      {/* Suggested Questions */}
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-deep-teal/60 mb-2.5">
          Common Questions
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => handleAsk(sq)}
              disabled={asking}
              className="rounded-sm border border-deep-teal/15 bg-surface px-3 py-1.5 text-xs font-medium text-deep-teal hover:border-bright-cyan hover:bg-bright-cyan/10 transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="mt-8 space-y-4 max-h-[32rem] overflow-y-auto pr-1">
        {loadingHistory && (
          <div className="py-6 text-center text-xs text-deep-teal/60 animate-pulse">
            Loading previous questions…
          </div>
        )}

        {!loadingHistory && questions.length === 0 && !asking && (
          <div className="py-8 text-center rounded-sm bg-surface/60 border border-dashed border-deep-teal/15 p-6">
            <HelpCircle className="mx-auto h-8 w-8 text-deep-teal/40 mb-2" />
            <p className="text-sm font-semibold text-deep-teal">No questions asked yet.</p>
            <p className="mt-0.5 text-xs text-deep-teal/60">
              Type a question below or click any of the suggested prompts above.
            </p>
          </div>
        )}

        {questions.map((item) => (
          <div key={item.id} className="space-y-3 pt-2">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="flex max-w-[90%] sm:max-w-[85%] items-start gap-2.5 rounded-sm bg-deep-teal px-3.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-xs">
                <p className="text-sm leading-relaxed break-words">{item.question}</p>
                <User className="h-4 w-4 shrink-0 mt-0.5 text-bright-cyan" />
              </div>
            </div>

            {/* AI Answer */}
            <div className="flex justify-start">
              <div className="max-w-[92%] sm:max-w-[88%] rounded-sm border border-deep-teal/15 bg-surface p-3.5 sm:p-5 shadow-xs">
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-deep-teal/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-bright-cyan" />
                    <span className="text-xs font-bold text-deep-teal">ClearDoc Answer</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-xs bg-ocean-teal/10 px-2 py-0.5 text-[0.65rem] font-bold text-ocean-teal">
                      <CheckCircle2 className="h-3 w-3" />
                      Grounded
                    </span>

                    <button
                      type="button"
                      onClick={() => play(item.answer, language)}
                      title="Read answer aloud"
                      aria-label="Read answer aloud"
                      className="p-1 rounded-xs text-deep-teal/60 hover:text-bright-cyan hover:bg-bright-cyan/10 transition-colors cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-deep-teal/90 whitespace-pre-wrap break-words">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        ))}

        {asking && (
          <div className="flex justify-start pt-2">
            <div className="rounded-sm border border-deep-teal/15 bg-surface px-4 py-3 text-sm text-deep-teal shadow-xs flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-deep-teal border-t-transparent" />
              <span>Analyzing document and generating answer…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div
          className="mt-4 flex items-center gap-2.5 rounded-sm border-l-4 border-terracotta bg-terracotta/10 px-4 py-3 text-xs text-deep-teal"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-terracotta" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Field */}
      <div className="mt-6 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this document (e.g., When is the due date?)"
          disabled={asking}
          className="field flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => handleAsk()}
          disabled={!inputText.trim() || asking}
          className="btn btn-primary px-4 sm:px-5 py-3 shadow-xs shrink-0 font-bold disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </div>
    </section>
  );
};

export default DocumentQA;
