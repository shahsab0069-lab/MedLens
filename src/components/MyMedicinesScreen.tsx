import React, { useState } from 'react';
import { Medicine, Language, InteractionAlert, DuplicateAlert } from '../types';
import { translations } from '../translations';
import { checkInteractions, checkDuplicateIngredients } from '../storage';
import { fetchSpokenSummary, playSpokenText, stopSpokenText } from '../speech';
import {
  Pill,
  Clock,
  Trash2,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Volume2,
  Square,
  Loader2,
  Calendar,
  Utensils,
  PlusCircle,
} from 'lucide-react';

interface MyMedicinesScreenProps {
  medicines: Medicine[];
  language: Language;
  onBack: () => void;
  onScanNew: () => void;
  onDeleteMedicine: (id: string) => void;
  onAddSamplePair?: () => void;
}

export const MyMedicinesScreen: React.FC<MyMedicinesScreenProps> = ({
  medicines,
  language,
  onBack,
  onScanNew,
  onDeleteMedicine,
  onAddSamplePair,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  // Interaction and duplicate checks
  const interactions: InteractionAlert[] = checkInteractions(medicines);
  const duplicates: DuplicateAlert[] = checkDuplicateIngredients(medicines);

  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [spokenCache, setSpokenCache] = useState<Record<string, { text: string; englishFallback?: string }>>({});

  const handlePlayVoice = async (med: Medicine) => {
    const medId = med.id || med.brand_name;
    if (playingId === medId) {
      stopSpokenText();
      setPlayingId(null);
      return;
    }

    stopSpokenText();
    let cached = spokenCache[medId];

    if (!cached) {
      setLoadingAudioId(medId);
      try {
        const res = await fetchSpokenSummary(med, language);
        cached = res;
        setSpokenCache((prev) => ({ ...prev, [medId]: res }));
      } catch (e) {
        cached = {
          text: isUrdu
            ? `یہ دوا ${med.brand_name || med.generic_name} ہے۔ خوراک اور اوقات کے لیے اپنے فارماسسٹ سے پوچھیں۔`
            : `Take ${med.brand_name || med.generic_name} as directed by your doctor.`,
          englishFallback: `Take ${med.brand_name || med.generic_name} as directed by your doctor.`,
        };
      } finally {
        setLoadingAudioId(null);
      }
    }

    if (cached) {
      setPlayingId(medId);
      playSpokenText({
        text: cached.text,
        englishFallback: cached.englishFallback,
        language,
        onStart: () => setPlayingId(medId),
        onEnd: () => setPlayingId(null),
        onError: () => setPlayingId(null),
      });
    }
  };

  const morningMeds = medicines.filter(
    (m) => Array.isArray(m.timing) && m.timing.includes('morning')
  );
  const afternoonMeds = medicines.filter(
    (m) => Array.isArray(m.timing) && m.timing.includes('afternoon')
  );
  const nightMeds = medicines.filter(
    (m) => Array.isArray(m.timing) && m.timing.includes('night')
  );

  return (
    <div className={`p-4 pb-16 max-w-md mx-auto w-full ${isUrdu ? 'font-urdu' : ''}`}>
      {/* Top Header - Larger & Bold */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => {
            stopSpokenText();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-lg transition-colors active-press shadow-xs"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3]" />
          <span>{isUrdu ? 'واپس' : 'Home'}</span>
        </button>

        <h2 className="text-2xl font-black text-slate-950 tracking-tight">
          {t.myMedicinesTitle}
        </h2>

        <button
          onClick={() => {
            stopSpokenText();
            onScanNew();
          }}
          className="flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-base shadow-lg shadow-teal-700/25 active-press"
        >
          <Camera className="w-5 h-5 stroke-[2.8]" />
          <span>{isUrdu ? 'نئی دوا' : 'Add'}</span>
        </button>
      </div>

      {/* BIG RED INTERACTION WARNING CARDS */}
      {interactions.length > 0 && (
        <div className="space-y-4 mb-7 animate-in fade-in duration-300">
          {interactions.map((alert, idx) => (
            <div
              key={idx}
              className="bg-red-600 text-white rounded-3xl p-6 shadow-2xl border-4 border-red-800"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-md">
                  <AlertOctagon className="w-9 h-9 stroke-[3]" />
                </div>
                <div>
                  <span className="block text-sm font-black uppercase tracking-wider text-red-100">
                    {t.interactionAlertTitle}
                  </span>
                  <h3 className="text-2xl font-black leading-tight text-white mt-1">
                    {alert.medA} + {alert.medB}
                  </h3>
                </div>
              </div>

              <div className="bg-red-700/90 rounded-2xl p-4 text-xl sm:text-2xl font-black leading-snug border-2 border-red-400/50">
                ⚠️ {isUrdu && alert.messageUrdu ? alert.messageUrdu : alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DUPLICATE INGREDIENT WARNING CARDS */}
      {duplicates.length > 0 && (
        <div className="space-y-4 mb-7 animate-in fade-in duration-300">
          {duplicates.map((dup, idx) => (
            <div
              key={idx}
              className="bg-amber-500 text-white rounded-3xl p-6 shadow-xl border-4 border-amber-700"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-md">
                  <AlertTriangle className="w-9 h-9 stroke-[3]" />
                </div>
                <div>
                  <span className="block text-sm font-black uppercase tracking-wider text-amber-100">
                    {t.duplicateAlertTitle}
                  </span>
                  <h3 className="text-2xl font-black leading-tight text-white mt-1">
                    {dup.medicines.join(' & ')}
                  </h3>
                </div>
              </div>

              <div className="bg-amber-600/90 rounded-2xl p-4 text-xl font-black leading-snug border-2 border-amber-400">
                {t.duplicateAlertMsg} ({dup.genericName})
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMBINED DAILY SCHEDULE GROUPED BY MORNING / AFTERNOON / NIGHT */}
      {medicines.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border-4 border-teal-200 shadow-md mb-7">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-100">
            <Calendar className="w-7 h-7 text-teal-700 stroke-[2.5]" />
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">
              {t.combinedSchedule}
            </h3>
          </div>

          <div className="space-y-5">
            {/* MORNING ☀️ */}
            <div className="bg-amber-50 rounded-3xl p-5 border-3 border-amber-300">
              <div className="flex items-center gap-2.5 text-amber-950 font-black text-2xl mb-3.5">
                <span className="text-3xl">☀️</span>
                <span>{t.morningRoutine}</span>
                <span className="text-sm font-black bg-amber-200 text-amber-950 px-3 py-1 rounded-full ml-auto">
                  {morningMeds.length}
                </span>
              </div>
              {morningMeds.length > 0 ? (
                <div className="space-y-3">
                  {morningMeds.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-black text-xl text-slate-950 block leading-tight">
                          {m.brand_name}
                        </span>
                        <span className="text-sm font-black text-slate-600 mt-0.5 block">
                          {m.dose || m.strength || '1 dose'} ·{' '}
                          {m.with_food === 'before'
                            ? t.beforeFood
                            : m.with_food === 'after'
                            ? t.afterFood
                            : t.unspecifiedFood}
                        </span>
                      </div>
                      <span className="text-sm font-black text-amber-950 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300">
                        {m.strength || '☀️'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-500 italic">
                  {t.noMedsForTime}
                </p>
              )}
            </div>

            {/* AFTERNOON 🌤️ */}
            <div className="bg-orange-50 rounded-3xl p-5 border-3 border-orange-300">
              <div className="flex items-center gap-2.5 text-orange-950 font-black text-2xl mb-3.5">
                <span className="text-3xl">🌤️</span>
                <span>{t.afternoonRoutine}</span>
                <span className="text-sm font-black bg-orange-200 text-orange-950 px-3 py-1 rounded-full ml-auto">
                  {afternoonMeds.length}
                </span>
              </div>
              {afternoonMeds.length > 0 ? (
                <div className="space-y-3">
                  {afternoonMeds.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-4 rounded-2xl border-2 border-orange-200 shadow-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-black text-xl text-slate-950 block leading-tight">
                          {m.brand_name}
                        </span>
                        <span className="text-sm font-black text-slate-600 mt-0.5 block">
                          {m.dose || m.strength || '1 dose'} ·{' '}
                          {m.with_food === 'before'
                            ? t.beforeFood
                            : m.with_food === 'after'
                            ? t.afterFood
                            : t.unspecifiedFood}
                        </span>
                      </div>
                      <span className="text-sm font-black text-orange-950 bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-300">
                        {m.strength || '🌤️'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-500 italic">
                  {t.noMedsForTime}
                </p>
              )}
            </div>

            {/* NIGHT 🌙 */}
            <div className="bg-indigo-50 rounded-3xl p-5 border-3 border-indigo-300">
              <div className="flex items-center gap-2.5 text-indigo-950 font-black text-2xl mb-3.5">
                <span className="text-3xl">🌙</span>
                <span>{t.nightRoutine}</span>
                <span className="text-sm font-black bg-indigo-200 text-indigo-950 px-3 py-1 rounded-full ml-auto">
                  {nightMeds.length}
                </span>
              </div>
              {nightMeds.length > 0 ? (
                <div className="space-y-3">
                  {nightMeds.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-4 rounded-2xl border-2 border-indigo-200 shadow-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-black text-xl text-slate-950 block leading-tight">
                          {m.brand_name}
                        </span>
                        <span className="text-sm font-black text-slate-600 mt-0.5 block">
                          {m.dose || m.strength || '1 dose'} ·{' '}
                          {m.with_food === 'before'
                            ? t.beforeFood
                            : m.with_food === 'after'
                            ? t.afterFood
                            : t.unspecifiedFood}
                        </span>
                      </div>
                      <span className="text-sm font-black text-indigo-950 bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-300">
                        {m.strength || '🌙'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-500 italic">
                  {t.noMedsForTime}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIST OF SAVED MEDICINES */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-2xl font-black text-slate-950">
            {t.myMedicinesCount} ({medicines.length})
          </h3>
        </div>

        {medicines.length === 0 ? (
          <div className="bg-white rounded-3xl p-9 border-4 border-dashed border-slate-300 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-12 h-12 rotate-45 stroke-[2.5]" />
            </div>
            <h4 className="text-2xl font-black text-slate-950 mb-2">
              {t.noMedicines}
            </h4>
            <p className="text-base font-bold text-slate-600 mb-7">
              {t.noMedicinesPrompt}
            </p>
            <button
              onClick={onScanNew}
              className="min-h-[72px] py-4 px-8 bg-teal-600 hover:bg-teal-700 text-white font-black text-2xl rounded-2xl shadow-xl shadow-teal-700/30 active-press inline-flex items-center gap-3"
            >
              <Camera className="w-7 h-7 stroke-[3]" />
              <span>{t.scanNow}</span>
            </button>
          </div>
        ) : (
          medicines.map((med) => {
            const medId = med.id || med.brand_name;
            const isPlaying = playingId === medId;
            const isLoadingAudio = loadingAudioId === medId;
            const isLowConf = med.confidence === 'low';

            return (
              <div
                key={medId}
                className="bg-white rounded-3xl border-3 border-slate-300 p-6 shadow-md space-y-5 relative overflow-hidden"
              >
                {/* Confidence banner if low */}
                {isLowConf && (
                  <div className="bg-orange-100 border-2 border-orange-300 text-orange-950 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                    <span>{t.unclearBanner}</span>
                  </div>
                )}

                {/* Main Card Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border-2 border-teal-300">
                      <Pill className="w-9 h-9 rotate-45 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
                        {med.brand_name}
                      </h4>
                      {med.generic_name && (
                        <p className="text-base font-extrabold text-teal-900 mt-0.5">
                          {med.generic_name}
                        </p>
                      )}
                      {med.strength && (
                        <span className="inline-block mt-1.5 text-sm font-black bg-slate-100 text-slate-900 px-3 py-0.5 rounded-lg border border-slate-300">
                          {med.strength}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (med.id && window.confirm(t.deleteConfirm)) {
                        onDeleteMedicine(med.id);
                      }
                    }}
                    className="p-3.5 rounded-2xl bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 transition-colors active-press shrink-0"
                    aria-label={t.deleteBtn}
                    title={t.deleteBtn}
                  >
                    <Trash2 className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>

                {/* Details row: Dose, Timings, Food */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 rounded-2xl p-4 text-center border-2 border-slate-200">
                  <div>
                    <span className="block text-xs font-black text-slate-500 uppercase">
                      {t.dose}
                    </span>
                    <span className="block text-base font-black text-slate-950 mt-1 truncate">
                      {isLowConf ? '—' : med.dose || '1 Unit'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-black text-slate-500 uppercase">
                      {t.dailySchedule}
                    </span>
                    <div className="flex items-center justify-center gap-1.5 text-xl mt-1">
                      {med.timing?.includes('morning') && <span>☀️</span>}
                      {med.timing?.includes('afternoon') && <span>🌤️</span>}
                      {med.timing?.includes('night') && <span>🌙</span>}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-black text-slate-500 uppercase">
                      {t.foodInstruction}
                    </span>
                    <span className="block text-xs sm:text-sm font-black text-slate-950 mt-1">
                      {med.with_food === 'before'
                        ? t.beforeFood
                        : med.with_food === 'after'
                        ? t.afterFood
                        : t.withFood}
                    </span>
                  </div>
                </div>

                {/* Big Listen Button on Card */}
                <button
                  onClick={() => handlePlayVoice(med)}
                  disabled={isLoadingAudio}
                  className={`w-full min-h-[64px] py-4 px-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 border-3 transition-all active-press ${
                    isPlaying
                      ? 'bg-orange-500 border-orange-700 text-white animate-pulse'
                      : 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-950'
                  }`}
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Square className="w-6 h-6 fill-current" />
                      <span>{t.stopAudioBtn}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-7 h-7 text-teal-800 stroke-[3]" />
                      <span>{t.listenBtn}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Helpful shortcut to test drug interaction check */}
      {onAddSamplePair && (
        <div className="mt-9 pt-6 border-t-2 border-slate-200 text-center">
          <button
            onClick={onAddSamplePair}
            className="text-sm font-black text-slate-600 hover:text-teal-800 underline flex items-center justify-center gap-2 mx-auto active-press p-2"
          >
            <PlusCircle className="w-5 h-5 text-teal-700 stroke-[2.5]" />
            <span>
              {isUrdu
                ? 'وارفرین اور ایسپرین شامل کریں (وارننگ ٹیسٹ کریں)'
                : 'Load Warfarin + Aspirin to test interaction warning'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
