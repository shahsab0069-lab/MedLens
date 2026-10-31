import { Medicine, Language } from './types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export interface SpokenSummaryResult {
  text: string;
  englishFallback?: string;
}

export async function fetchSpokenSummary(
  medicine: Medicine,
  language: Language
): Promise<SpokenSummaryResult> {
  const response = await fetch('/api/generate-spoken-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicine, language }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate voice instructions');
  }

  const data = await response.json();
  return {
    text: data.text || '',
    englishFallback: data.englishFallback || data.text || '',
  };
}

export function getAvailableUrduVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('ur') ||
        v.lang.toLowerCase().includes('pk') ||
        v.name.toLowerCase().includes('urdu')
    ) || null
  );
}

export function getAvailableEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.default)
    ) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    null
  );
}

export interface PlaySpokenOptions {
  text: string;
  englishFallback?: string;
  language: Language;
  onStart: (effectiveLang: Language, usedFallbackToEnglish: boolean) => void;
  onEnd: () => void;
  onError: (err: any) => void;
}

export function playSpokenText({
  text,
  englishFallback,
  language,
  onStart,
  onEnd,
  onError,
}: PlaySpokenOptions): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError(new Error('Speech synthesis not supported on this device'));
    return;
  }

  // Cancel any ongoing speech
  stopSpokenText();

  let textToSpeak = text;
  let speakLang = 'en-US';
  let usedFallback = false;

  const voices = window.speechSynthesis.getVoices();
  const urduVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith('ur') ||
      v.lang.toLowerCase().includes('pk') ||
      v.name.toLowerCase().includes('urdu')
  );

  let selectedVoice: SpeechSynthesisVoice | null = null;

  if (language === 'ur') {
    if (urduVoice) {
      // Urdu voice is available
      textToSpeak = text;
      speakLang = urduVoice.lang || 'ur-PK';
      selectedVoice = urduVoice;
      usedFallback = false;
    } else {
      // User requirement: "If no Urdu voice is available, speak in English."
      textToSpeak = englishFallback || text;
      speakLang = 'en-US';
      selectedVoice = getAvailableEnglishVoice();
      usedFallback = true;
    }
  } else {
    // English requested
    textToSpeak = text;
    speakLang = 'en-US';
    selectedVoice = getAvailableEnglishVoice();
    usedFallback = false;
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);

  // User requirement: slow rate of 0.85
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = speakLang;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => {
    onStart(usedFallback ? 'en' : language, usedFallback);
  };

  utterance.onend = () => {
    currentUtterance = null;
    onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    currentUtterance = null;
    onError(e);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpokenText(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}
