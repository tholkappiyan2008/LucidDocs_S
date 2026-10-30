import React, { useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SupportedLanguage } from '../context/A11yContext';
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
  analysis?: any;
  summary?: string;
  keyFacts?: Array<{ label: string; value: string }>;
  deadlines?: Array<{ label?: string; what?: string; date: string }>;
  riskExplanation?: string;
  nextSteps?: string[];
  translatedText?: string;
  language: SupportedLanguage;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  analysis,
  summary: propSummary,
  keyFacts: propKeyFacts,
  deadlines: propDeadlines,
  riskExplanation: propRiskExplanation,
  nextSteps: propNextSteps,
  translatedText,
  language,
}) => {
  const summary = propSummary || analysis?.plain_summary || '';
  const keyFacts = propKeyFacts || analysis?.key_facts || [];
  const deadlines = propDeadlines || analysis?.deadlines || [];
  const riskExplanation =
    propRiskExplanation ||
    (analysis?.risks ? analysis.risks.map((r: any) => `${r.level} risk: ${r.note}`).join('. ') : '');
  const nextSteps = propNextSteps || analysis?.next_steps || [];
  const {
    speaking,
    paused,
    play,
    pause,
    resume,
    stop,
    languageVoices,
    selectedVoice,
    setSelectedVoice,
    setRate,
    rate,
    isSupported,
    error: hookError,
  } = useSpeechSynthesis(language);

  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError || hookError;

  const buildFullScript = (): string => {
    if (translatedText && language !== 'en') {
      return translatedText;
    }

    const parts: string[] = [];
    if (summary) parts.push(`Summary. ${summary}`);

    if (keyFacts.length > 0) {
      const factsText = keyFacts.map((f: any) => `${f.label}: ${f.value}`).join('. ');
      parts.push(`Important facts. ${factsText}`);
    }

    if (deadlines.length > 0) {
      const deadlinesText = deadlines
        .map((d: any) => `${d.label || d.what} due on ${d.date}`)
        .join('. ');
      parts.push(`Deadlines. ${deadlinesText}`);
    }

    if (riskExplanation) {
      parts.push(`Risks and warnings. ${riskExplanation}`);
    }

    if (nextSteps.length > 0) {
      const stepsText = nextSteps.map((s: any, idx: number) => `Step ${idx + 1}: ${s}`).join('. ');
      parts.push(`Recommended next steps. ${stepsText}`);
    }

    return parts.join('. ');
  };

  const handlePlayToggle = () => {
    setLocalError(null);
    if (!isSupported) {
      setLocalError('Web Speech synthesis is not supported on this device/browser.');
      return;
    }

    if (speaking && !paused) {
      pause();
    } else if (speaking && paused) {
      resume();
    } else {
      const script = buildFullScript();
      if (!script.trim()) {
        setLocalError('No text content available to read aloud.');
        return;
      }
      play(script, language);
    }
  };

  const speedOptions = [0.8, 1.0, 1.25, 1.5];

  if (!isSupported) {
    return (
      <div
        className="flex items-center gap-3 rounded-sm border-l-4 border-terracotta bg-terracotta/10 px-5 py-4 text-sm text-deep-teal"
        role="status"
      >
        <VolumeX className="h-5 w-5 shrink-0 text-terracotta" aria-hidden="true" />
        <span>
          Web Speech synthesis is not supported in this browser. Read-aloud is unavailable, but
          every document analysis section remains fully readable below.
        </span>
      </div>
    );
  }

  return (
    <section className="rounded-sm border border-deep-teal/15 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-deep-teal/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-surface">
        <div className="flex items-center gap-3.5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm transition-colors ${
              speaking && !paused
                ? 'bg-bright-cyan text-deep-teal shadow-xs'
                : 'bg-deep-teal text-white'
            }`}
            aria-hidden="true"
          >
            <Volume2 className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-deep-teal">Voice Read-Aloud</h2>
              <span className="rounded-xs bg-ocean-teal/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-ocean-teal">
                Audio Synthesis
              </span>
            </div>
            <p className="text-xs text-deep-teal/65">
              Listen to the document summary, verified facts, deadlines and action items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" role="status" aria-live="polite">
          {speaking && !paused && (
            <span className="inline-flex items-center gap-2 rounded-xs border border-bright-cyan bg-bright-cyan/15 px-3 py-1 text-xs font-bold text-deep-teal">
              <span className="h-2 w-2 animate-pulse rounded-full bg-bright-cyan" aria-hidden="true" />
              Reading aloud
            </span>
          )}
          {speaking && paused && (
            <span className="inline-flex items-center gap-2 rounded-xs border border-deep-teal/20 bg-deep-teal/5 px-3 py-1 text-xs font-semibold text-deep-teal/75">
              <span className="h-2 w-2 rounded-full bg-terracotta" aria-hidden="true" />
              Paused
            </span>
          )}
          {!speaking && (
            <span className="rounded-xs border border-deep-teal/15 bg-white px-2.5 py-1 text-xs font-semibold text-deep-teal/60">
              Ready
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6 space-y-4">
        {error && (
          <div
            className="flex items-center gap-2.5 rounded-sm border-l-4 border-terracotta bg-terracotta/10 px-4 py-2.5 text-xs text-deep-teal"
            role="status"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Audio Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePlayToggle}
            className={`btn px-5 py-2.5 text-sm font-bold shadow-xs cursor-pointer ${
              speaking && !paused
                ? 'border border-bright-cyan bg-bright-cyan/20 text-deep-teal hover:bg-bright-cyan/30'
                : 'btn-primary'
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
                <Pause className="h-4 w-4" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>{speaking && paused ? 'Resume' : 'Listen now'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={stop}
            disabled={!speaking}
            className="btn btn-quiet py-2.5 px-4 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Stop reading aloud"
            title="Stop playback"
          >
            <Square className="h-3.5 w-3.5 text-deep-teal" aria-hidden="true" />
            <span>Stop</span>
          </button>

          {/* Speed Selector */}
          <div className="ml-auto flex items-center gap-1.5 rounded-sm border border-deep-teal/15 bg-surface px-2.5 py-1">
            <Gauge className="h-3.5 w-3.5 text-deep-teal/60" aria-hidden="true" />
            <span className="hidden text-xs font-semibold text-deep-teal/70 sm:inline mr-1">
              Speed
            </span>
            {speedOptions.map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setRate(sp)}
                aria-pressed={rate === sp}
                title={`Speech speed ${sp}x`}
                className={`rounded-xs px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                  rate === sp
                    ? 'bg-deep-teal text-white shadow-xs'
                    : 'text-deep-teal/70 hover:text-deep-teal'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>

          {/* Voice Selector */}
          {languageVoices.length > 1 && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-deep-teal/60" aria-hidden="true" />
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const chosen = languageVoices.find((v) => v.name === e.target.value);
                  if (chosen) setSelectedVoice(chosen);
                }}
                className="w-full rounded-sm border border-deep-teal/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-deep-teal focus:border-bright-cyan focus:outline-none sm:w-auto cursor-pointer"
                aria-label="Select browser speech voice"
              >
                {languageVoices.slice(0, 10).map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AudioPlayer;
