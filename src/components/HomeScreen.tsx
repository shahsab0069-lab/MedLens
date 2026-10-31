import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { SAMPLE_MEDICINE_PHOTOS } from '../constants';
import { Camera, Pill, ArrowRight, Check } from 'lucide-react';

interface HomeScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onScanClick: () => void;
  onMyMedicinesClick: () => void;
  onSelectSample: (sampleImage: string, sampleResult?: any) => void;
  savedCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  onLanguageChange,
  onScanClick,
  onMyMedicinesClick,
  onSelectSample,
  savedCount,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  return (
    <div className={`p-4 pb-12 flex flex-col items-center max-w-md mx-auto w-full ${isUrdu ? 'font-urdu' : ''}`}>
      {/* Visual Hero Card - High Contrast & Large Elements */}
      <div className="w-full bg-linear-to-b from-teal-600 to-teal-800 text-white rounded-3xl p-6 sm:p-7 text-center shadow-xl shadow-teal-900/20 mb-5 relative overflow-hidden border-3 border-teal-500">
        <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border-2 border-white/40 shadow-inner">
          <Pill className="w-12 h-12 text-white stroke-[2.8] rotate-45" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2.5 drop-shadow-xs">
          {t.appName}
        </h1>
        <p className="text-teal-100 font-extrabold text-2xl sm:text-3xl max-w-sm mx-auto mb-5 leading-snug">
          "{t.tagline}"
        </p>

        {/* 3 Large Visual Pillars */}
        <div className="grid grid-cols-3 gap-2.5 bg-black/20 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/20">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">📸</span>
            <span className="text-white font-extrabold text-sm sm:text-base leading-tight">
              {isUrdu ? 'تصویر لیں' : 'Snap Photo'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 border-x border-white/20">
            <span className="text-3xl">☀️</span>
            <span className="text-white font-extrabold text-sm sm:text-base leading-tight">
              {isUrdu ? 'وقت جانیں' : 'Clear Time'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🔊</span>
            <span className="text-white font-extrabold text-sm sm:text-base leading-tight">
              {isUrdu ? 'آواز سنیں' : 'Hear Voice'}
            </span>
          </div>
        </div>
      </div>

      {/* LANGUAGE SELECTOR - Very Big Buttons */}
      <div className="w-full bg-white rounded-3xl p-4 sm:p-5 border-3 border-slate-300 shadow-md mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <span>{t.selectLanguageHeading}</span>
          </span>
          <span className="text-xs font-black text-teal-900 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
            {isUrdu ? 'اردو فعال ہے' : 'English Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* English Big Button */}
          <button
            onClick={() => onLanguageChange('en')}
            className={`min-h-[72px] py-4 px-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2.5 border-4 transition-all active-press ${
              !isUrdu
                ? 'bg-teal-600 border-teal-800 text-white shadow-lg shadow-teal-700/30'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
            }`}
          >
            <span className="text-2xl">🇬🇧</span>
            <span>English</span>
            {!isUrdu && <Check className="w-6 h-6 stroke-[3.5]" />}
          </button>

          {/* Urdu Big Button */}
          <button
            onClick={() => onLanguageChange('ur')}
            className={`min-h-[72px] py-4 px-4 rounded-2xl font-black text-2xl flex items-center justify-center gap-2.5 border-4 transition-all active-press font-urdu ${
              isUrdu
                ? 'bg-amber-500 border-amber-700 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
            }`}
          >
            <span className="text-2xl">🇵🇰</span>
            <span>اردو</span>
            {isUrdu && <Check className="w-6 h-6 stroke-[3.5]" />}
          </button>
        </div>
      </div>

      {/* Primary Huge Action: Scan Medicine */}
      <div className="w-full space-y-5 mb-8">
        <button
          onClick={onScanClick}
          className="w-full min-h-[120px] py-7 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-3xl shadow-xl shadow-teal-700/30 flex items-center justify-between border-4 border-teal-400 transition-all active-press group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-20 h-20 rounded-2xl bg-white text-teal-800 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0 border-2 border-teal-200">
              <Camera className="w-11 h-11 stroke-[2.8]" />
            </div>
            <div>
              <span className="block text-3xl font-black tracking-tight leading-tight">
                {t.scanMedicineBtn}
              </span>
              <span className="block text-base font-extrabold text-teal-100 mt-1.5">
                {isUrdu ? 'کیمرہ یا گیلری سے اسکین کریں' : 'Camera or Photo Upload'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-8 h-8 text-teal-200 group-hover:translate-x-1.5 transition-transform shrink-0" />
        </button>

        {/* Secondary Big Action: My Medicines */}
        <button
          onClick={onMyMedicinesClick}
          className="w-full min-h-[105px] py-6 px-6 bg-white hover:bg-slate-50 text-slate-950 rounded-3xl shadow-lg border-4 border-slate-300 flex items-center justify-between transition-all active-press group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-18 h-18 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-sm shrink-0 border-2 border-orange-200">
              <Pill className="w-10 h-10 stroke-[2.8] rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="block text-2xl sm:text-3xl font-black tracking-tight text-slate-950 leading-tight">
                  {t.myMedicinesBtn}
                </span>
                {savedCount > 0 && (
                  <span className="bg-teal-600 text-white text-sm font-black px-3 py-1 rounded-full shadow-xs">
                    {savedCount}
                  </span>
                )}
              </div>
              <span className="block text-base font-bold text-slate-600 mt-1">
                {isUrdu ? 'روزانہ کا شیڈول اور انتباہ' : 'Daily Schedule & Safety Warnings'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-8 h-8 text-slate-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* Quick Test Samples - Large Touch Tiles */}
      <div className="w-full bg-white rounded-3xl p-5 sm:p-6 border-3 border-slate-300 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-black text-slate-900 flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span>{t.orTrySample}</span>
          </p>
          <span className="text-xs font-black text-teal-900 bg-teal-100 px-3 py-1 rounded-lg border border-teal-300">
            {isUrdu ? 'آزمائشی نمونہ' : 'Demo Test'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {SAMPLE_MEDICINE_PHOTOS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample.image, sample.sampleResult)}
              className="w-full min-h-[84px] p-4 rounded-2xl bg-slate-50 hover:bg-teal-50 border-3 border-slate-200 hover:border-teal-500 text-left transition-colors flex items-center justify-between active-press"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-300">
                  <Pill className="w-8 h-8 text-teal-800 rotate-45 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-950 leading-tight">
                    {isUrdu ? sample.urduName : sample.name}
                  </h4>
                  <p className="text-sm font-bold text-slate-600 mt-1">
                    {sample.type}
                  </p>
                </div>
              </div>
              <span className="text-base font-black text-teal-900 bg-white px-3.5 py-2 rounded-xl border-2 border-teal-300 shadow-xs">
                {isUrdu ? 'اسکین' : 'Scan'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
