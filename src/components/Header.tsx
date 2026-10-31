import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { Pill } from 'lucide-react';

interface HeaderProps {
  currentScreen: 'home' | 'scan' | 'result' | 'saved';
  onNavigate: (screen: 'home' | 'scan' | 'result' | 'saved') => void;
  language: Language;
  onToggleLanguage: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  language,
  onToggleLanguage,
  savedCount,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-3 border-teal-200 shadow-sm px-4 py-3.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Logo and Tagline */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group focus:outline-hidden active-press"
          aria-label="MedLens Home"
        >
          <div className="w-13 h-13 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 group-hover:bg-teal-700 transition-colors shrink-0">
            <Pill className="w-8 h-8 rotate-45 stroke-[2.8]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-2xl sm:text-3xl tracking-tight text-slate-950 font-sans">
                {t.appName}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-black text-teal-800 tracking-wide">
              {t.tagline}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher - Very Large & Clear */}
          <button
            onClick={onToggleLanguage}
            className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-base font-black border-3 transition-all flex items-center gap-2 shadow-xs active-press ${
              isUrdu
                ? 'bg-amber-100 border-amber-400 text-amber-950 font-urdu'
                : 'bg-teal-100/80 border-teal-400 text-teal-950'
            }`}
            aria-label="Switch Language"
            title="Switch Language"
          >
            <span className="text-xl">🌐</span>
            <span>{isUrdu ? 'English' : 'اردو'}</span>
          </button>

          {/* Quick pill to My Medicines if not on home */}
          {currentScreen !== 'saved' && (
            <button
              onClick={() => onNavigate('saved')}
              className="relative min-h-[48px] p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-900 transition-colors active-press flex items-center justify-center shrink-0"
              aria-label="My Medicines"
              title={t.myMedicinesBtn}
            >
              <Pill className="w-6 h-6 text-teal-800 rotate-45" />
              {savedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[24px] h-6 px-1.5 bg-teal-600 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {savedCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
