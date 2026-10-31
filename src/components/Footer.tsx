import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { ShieldAlert } from 'lucide-react';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  return (
    <footer className="mt-auto py-6 px-4 bg-slate-200 border-t-3 border-slate-300 text-center">
      <div className="max-w-md mx-auto flex items-start justify-center gap-3 text-slate-800">
        <ShieldAlert className="w-6 h-6 text-teal-800 shrink-0 mt-0.5" />
        <p className={`text-base sm:text-lg font-black leading-snug ${isUrdu ? 'font-urdu text-lg' : ''}`}>
          {t.footerDisclaimer}
        </p>
      </div>
    </footer>
  );
};
