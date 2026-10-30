import React, { useMemo, useEffect } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SupportedLanguage } from '../context/A11yContext';
import { DocumentRecord } from '../services/document.service';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  AlertCircle,
  Gauge,
  UserCheck,
} from 'lucide-react';

interface AudioPlayerProps {
  analysis: DocumentRecord['analysis'];
  language: SupportedLanguage;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ analysis, language }) => {
  const {
    isSupported,
    languageVoices,
    selectedVoice,
    setSelectedVoice,
    speaking,
    paused,
    rate,
    setRate,
    play,
    pause,
    resume,
    stop,
    error,
  } = useSpeechSynthesis(language);

  // Stop playback when language changes to ensure audio is synchronized
  useEffect(() => {
    stop();
  }, [language, stop]);

  // Construct comprehensive speech text tailored to the active language
  const speechText = useMemo(() => {
    if (!analysis) return '';

    const parts: string[] = [];

    // Summary
    if (analysis.plain_summary) {
      parts.push(analysis.plain_summary);
    }

    // Key facts
    if (analysis.key_facts && analysis.key_facts.length > 0) {
      const factsText = analysis.key_facts
        .map((f) => `${f.label}: ${f.value}`)
        .join('. ');
      parts.push(factsText);
    }

    // Deadlines
    if (analysis.deadlines && analysis.deadlines.length > 0) {
      const deadlinesText = analysis.deadlines
        .map((d) => `${d.what}, due date: ${d.date}`)
        .join('. ');
      parts.push(deadlinesText);
    }

    // Risks
    if (analysis.risks && analysis.risks.length > 0) {
      const risksText = analysis.risks.map((r) => r.note).join('. ');
      parts.push(risksText);
    }

    // Next steps
    if (analysis.next_steps && analysis.next_steps.length > 0) {
      const stepsText = analysis.next_steps
        .map((s, idx) => `Step ${idx + 1}: ${s}`)
        .join('. ');
      parts.push(stepsText);
    }

    return parts.join('. ');
  }, [analysis]);

  const handlePlayToggle = () => {
    if (speaking && !paused) {
      pause();
    } else if (speaking && paused) {
      resume();
    } else {
      play(speechText, language);
    }
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  const languageLabels: Record<string, string> = {
    en: 'English',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)',
    hi: 'हिंदी (Hindi)',
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm mb-6">
        <VolumeX className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <span>
          Web Speech synthesis is not supported on this browser. Voice read-aloud is unavailable, but you can read the high-contrast text below.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-200 shadow-sm p-6 mb-8 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              speaking && !paused
                ? 'bg-emerald-600 text-white shadow-lg animate-pulse'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Voice Read-Aloud</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {languageLabels[language] || language}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Listen to the document summary, important facts, and deadlines
            </p>
          </div>
        </div>

        {/* Live Playback Status Indicator */}
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          {speaking && !paused && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Reading aloud...</span>
            </div>
          )}
          {speaking && paused && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Paused</span>
            </div>
          )}
          {!speaking && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
              <span>Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Voice Missing Notice for Tamil/Telugu/Hindi on some client OS */}
      {language !== 'en' && languageVoices.length === 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <strong>Native {languageLabels[language]} voice pack not found on device:</strong>
            <p className="mt-0.5 text-amber-800">
              Your browser will attempt to synthesize using its default engine, or you can read the verified text cards below. You can also install language speech packs in your Windows/macOS Settings.
            </p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audio Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${
            speaking && !paused
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
          aria-label={
            speaking && !paused
              ? 'Pause reading aloud'
              : speaking && paused
              ? 'Resume reading aloud'
              : 'Play document read-aloud'
          }
        >
          {speaking && !paused ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{speaking && paused ? 'Resume' : 'Listen Now'}</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        <button
          type="button"
          onClick={stop}
          disabled={!speaking}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-slate-400"
          aria-label="Stop reading aloud"
          title="Stop playback"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>Stop</span>
        </button>

        {/* Speed Controls */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 ml-auto">
          <Gauge className="w-4 h-4 text-slate-400 ml-2 mr-1 hidden sm:block" />
          <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Speed:</span>
          {speedOptions.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setRate(sp)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                rate === sp
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
              aria-pressed={rate === sp}
              title={`Speech rate ${sp}x`}
            >
              {sp}x
            </button>
          ))}
        </div>

        {/* Voice Selector (if multiple matching voices detected) */}
        {languageVoices.length > 1 && (
          <div className="w-full sm:w-auto flex items-center gap-2 mt-2 sm:mt-0">
            <UserCheck className="w-4 h-4 text-slate-400" />
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const chosen = languageVoices.find((v) => v.name === e.target.value);
                if (chosen) setSelectedVoice(chosen);
              }}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 py-1.5 px-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              aria-label="Select browser speech voice"
            >
              {languageVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
