import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  languageVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  speaking: boolean;
  paused: boolean;
  rate: number;
  setRate: (rate: number) => void;
  play: (text: string, langCode: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  error: string | null;
}

export function useSpeechSynthesis(currentLangCode: string): UseSpeechSynthesisReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
      };

      updateVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    } else {
      setIsSupported(false);
      setError('Web Speech Synthesis is not supported in this browser.');
    }

    // Cancel speech on unmount (e.g. navigating away from document)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Filter voices that match the active language prefix (e.g., 'en', 'ta', 'te', 'hi')
  const languageVoices = voices.filter((v) => {
    const lang = v.lang.toLowerCase();
    const target = currentLangCode.toLowerCase();
    return lang.startsWith(target) || lang.includes(`-${target}`) || lang.includes(`_${target}`);
  });

  // Automatically pick best voice when language or available voices change
  useEffect(() => {
    if (languageVoices.length > 0) {
      // Pick local default or first matching voice
      const preferred = languageVoices.find((v) => v.default) || languageVoices[0];
      setSelectedVoice(preferred);
    } else {
      setSelectedVoice(null);
    }
  }, [currentLangCode, voices]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, [isSupported]);

  const play = useCallback(
    (text: string, langCode: string) => {
      if (!isSupported) {
        setError('Speech synthesis is not available on your browser.');
        return;
      }

      if (!text || text.trim().length === 0) {
        setError('No text available to read aloud.');
        return;
      }

      setError(null);

      // Stop any existing speech session to prevent overlap
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;

      // Assign matching voice if found
      const matchingVoices = window.speechSynthesis.getVoices().filter((v) => {
        const l = v.lang.toLowerCase();
        const t = langCode.toLowerCase();
        return l.startsWith(t) || l.includes(`-${t}`) || l.includes(`_${t}`);
      });

      if (selectedVoice && matchingVoices.some((v) => v.name === selectedVoice.name)) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else if (matchingVoices.length > 0) {
        utterance.voice = matchingVoices[0];
        utterance.lang = matchingVoices[0].lang;
      } else {
        // Fallback language code mapping
        const bcp47Map: Record<string, string> = {
          en: 'en-US',
          ta: 'ta-IN',
          te: 'te-IN',
          hi: 'hi-IN',
        };
        utterance.lang = bcp47Map[langCode] || langCode;
      }

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
      };

      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };

      utterance.onerror = (e) => {
        // 'interrupted' is expected when user clicks Stop or switches language
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[SpeechSynthesis Error]:', e);
          setError(`Audio playback error: ${e.error}`);
        }
        setSpeaking(false);
        setPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, selectedVoice]
  );

  return {
    isSupported,
    voices,
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
  };
}
