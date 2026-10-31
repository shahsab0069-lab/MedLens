import React, { useState, useEffect } from 'react';
import { Medicine, ScanResult, Language } from '../types';
import { translations } from '../translations';
import { EditMedicineModal } from './EditMedicineModal';
import { checkSingleMedicineInteractions } from '../storage';
import {
  fetchSpokenSummary,
  playSpokenText,
  stopSpokenText,
  SpokenSummaryResult,
} from '../speech';
import {
  Pill,
  Clock,
  Utensils,
  Volume2,
  Square,
  Edit3,
  BookmarkPlus,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  Camera,
  Loader2,
  Info,
} from 'lucide-react';

interface ResultScreenProps {
  scanResult: ScanResult;
  language: Language;
  onBack: () => void;
  onSaveMedicine: (medicine: Medicine) => void;
  onScanAnother: () => void;
  onGoToMyMedicines: () => void;
  savedMedicinesList: Medicine[];
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  scanResult,
  language,
  onBack,
  onSaveMedicine,
  onScanAnother,
  onGoToMyMedicines,
  savedMedicinesList,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  const [medicines, setMedicines] = useState<Medicine[]>(scanResult.medicines || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Voice playback states
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [spokenDataCache, setSpokenDataCache] = useState<Record<number, SpokenSummaryResult>>({});
  const [fallbackNoticeIndex, setFallbackNoticeIndex] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Save feedback state
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});

  // Stop any audio when leaving screen
  useEffect(() => {
    return () => {
      stopSpokenText();
    };
  }, []);

  const handleEditSave = (updated: Medicine) => {
    if (editingIndex === null) return;
    const nextList = [...medicines];
    nextList[editingIndex] = updated;
    setMedicines(nextList);
    setEditingIndex(null);
    const nextCache = { ...spokenDataCache };
    delete nextCache[editingIndex];
    setSpokenDataCache(nextCache);
  };

  const handleListen = async (med: Medicine, index: number) => {
    if (playingAudioIndex === index) {
      stopSpokenText();
      setPlayingAudioIndex(null);
      setFallbackNoticeIndex(null);
      return;
    }

    stopSpokenText();
    setAudioError(null);
    setFallbackNoticeIndex(null);

    let summaryData = spokenDataCache[index];

    if (!summaryData) {
      setLoadingAudioIndex(index);
      try {
        summaryData = await fetchSpokenSummary(med, language);
        setSpokenDataCache((prev) => ({ ...prev, [index]: summaryData }));
      } catch (err: any) {
        console.warn('Voice generation failed, using fallback:', err);
        const medName = med.brand_name || med.generic_name || 'your medicine';
        summaryData = {
          text: isUrdu
            ? `یہ دوا ${medName} ہے۔ خوراک اور اوقات کے لیے اپنے ڈاکٹر کی ہدایت پر عمل کریں۔`
            : `Take ${medName} as directed by your doctor with water.`,
          englishFallback: `Take ${medName} as directed by your doctor with water.`,
        };
      } finally {
        setLoadingAudioIndex(null);
      }
    }

    if (summaryData) {
      setPlayingAudioIndex(index);
      playSpokenText({
        text: summaryData.text,
        englishFallback: summaryData.englishFallback,
        language,
        onStart: (_effectiveLang, usedFallbackToEnglish) => {
          setPlayingAudioIndex(index);
          if (usedFallbackToEnglish) {
            setFallbackNoticeIndex(index);
          }
        },
        onEnd: () => {
          setPlayingAudioIndex(null);
        },
        onError: (err) => {
          console.warn('Speech playback issue:', err);
          setPlayingAudioIndex(null);
          setAudioError(
            isUrdu
              ? 'براہ کرم اسکرین پر لکھی ہوئی ہدایات پڑھیں۔'
              : 'Voice speech playback not available; instructions are displayed below.'
          );
        },
      });
    }
  };

  const handleSave = (med: Medicine, index: number) => {
    onSaveMedicine(med);
    setSavedStatus((prev) => ({ ...prev, [index]: true }));
  };

  const isAlreadySaved = (med: Medicine) => {
    return savedMedicinesList.some(
      (m) =>
        (m.id && m.id === med.id) ||
        (m.brand_name.toLowerCase() === med.brand_name.toLowerCase() &&
          m.generic_name.toLowerCase() === med.generic_name.toLowerCase())
    );
  };

  return (
    <div className={`p-4 pb-16 max-w-md mx-auto w-full ${isUrdu ? 'font-urdu' : ''}`}>
      {/* Top Header - Larger & High Contrast */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => {
            stopSpokenText();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-lg transition-colors active-press shadow-xs"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3]" />
          <span>{isUrdu ? 'واپس' : 'Scan'}</span>
        </button>

        <h2 className="text-2xl font-black text-slate-950 tracking-tight">
          {t.resultsTitle}
        </h2>

        <button
          onClick={onScanAnother}
          className="p-3 rounded-2xl bg-teal-100 hover:bg-teal-200 text-teal-950 font-black border-2 border-teal-300 active-press"
          title={t.scanAnother}
        >
          <Camera className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Document info banner */}
      <div className="flex items-center justify-between bg-teal-50 border-2 border-teal-300 rounded-2xl px-4 py-3 mb-6 text-sm font-black text-teal-950 shadow-xs">
        <span className="flex items-center gap-2">
          <Info className="w-5 h-5 text-teal-700" />
          <span>
            {scanResult.document_type === 'prescription'
              ? t.prescription
              : scanResult.document_type === 'medicine_package'
              ? t.medicinePackage
              : t.unknownDoc}
          </span>
        </span>
        <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-xs">
          {medicines.length} {medicines.length === 1 ? (isUrdu ? 'دوا' : 'medicine') : (isUrdu ? 'ادویات' : 'medicines')}
        </span>
      </div>

      {/* Audio Error Banner */}
      {audioError && (
        <div className="mb-4 p-4 bg-amber-50 border-3 border-amber-300 rounded-2xl text-amber-950 text-sm font-bold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Medicine Cards List */}
      <div className="space-y-7">
        {medicines.map((med, index) => {
          const isLowConfidence = med.confidence === 'low';
          const isPlaying = playingAudioIndex === index;
          const isLoadingAudio = loadingAudioIndex === index;
          const isSaved = savedStatus[index] || isAlreadySaved(med);
          const cachedData = spokenDataCache[index];
          const hasFallbackNotice = fallbackNoticeIndex === index;

          const medTimings = Array.isArray(med.timing) ? med.timing : ['morning'];
          const singleInteractions = checkSingleMedicineInteractions(med, savedMedicinesList);

          return (
            <div
              key={med.id || index}
              className={`bg-white rounded-3xl border-4 shadow-xl p-6 transition-all ${
                singleInteractions.length > 0
                  ? 'border-red-600 shadow-red-500/15'
                  : isLowConfidence
                  ? 'border-orange-400 shadow-orange-500/10'
                  : 'border-teal-600 shadow-teal-900/10'
              }`}
            >
              {/* BIG RED INTERACTION WARNING CARD IF INTERACTION DETECTED */}
              {singleInteractions.length > 0 && (
                <div className="bg-red-600 text-white rounded-3xl p-5 sm:p-6 mb-5 shadow-2xl border-4 border-red-800 animate-in fade-in">
                  <div className="flex items-start gap-4 mb-2.5">
                    <div className="w-14 h-14 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-md">
                      <AlertOctagon className="w-9 h-9 stroke-[3]" />
                    </div>
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-red-100">
                        {t.interactionAlertTitle}
                      </span>
                      <h4 className="text-2xl font-black text-white leading-tight mt-0.5">
                        {singleInteractions[0].medA} + {singleInteractions[0].medB}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-red-700/90 rounded-2xl p-4 text-xl font-black leading-snug border-2 border-red-400/50 mb-3">
                    ⚠️ {isUrdu && singleInteractions[0].messageUrdu ? singleInteractions[0].messageUrdu : singleInteractions[0].message}
                  </div>
                  <button
                    type="button"
                    onClick={onGoToMyMedicines}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-red-700 font-black text-base rounded-2xl transition-all shadow-md active-press"
                  >
                    {isUrdu ? 'محفوظ شدہ ادویات میں دیکھیں' : 'View in My Medicines'}
                  </button>
                </div>
              )}

              {/* LOW CONFIDENCE ORANGE BANNER */}
              {isLowConfidence && (
                <div className="bg-orange-500 text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-sm flex items-start gap-3.5 border-2 border-orange-600">
                  <AlertTriangle className="w-8 h-8 text-white shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-lg sm:text-xl leading-snug">
                      {t.unclearBanner}
                    </p>
                    <p className="text-sm font-bold text-orange-100 mt-1.5">
                      {t.doseHiddenNotice}
                    </p>
                  </div>
                </div>
              )}

              {/* Medicine Header: Pill Icon + Brand Name + Generic + Strength */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-20 h-20 rounded-3xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border-3 border-teal-300 shadow-md">
                  <Pill className="w-11 h-11 stroke-[2.8] rotate-45" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight break-words">
                    {med.brand_name || med.generic_name || 'Medicine'}
                  </h3>
                  {med.generic_name && (
                    <p className="text-lg font-black text-teal-900 mt-1">
                      {t.genericName}: <span className="underline decoration-teal-500 decoration-2">{med.generic_name}</span>
                    </p>
                  )}
                  {med.strength && (
                    <span className="inline-block mt-2 px-3.5 py-1 bg-slate-100 border-2 border-slate-300 text-slate-900 text-base font-black rounded-xl">
                      {med.strength}
                    </span>
                  )}
                </div>
              </div>

              {/* DOSE SECTION - Extra Large Text */}
              <div className="mb-6 bg-slate-50 border-3 border-slate-300 rounded-3xl p-5">
                <span className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  {t.dose}
                </span>
                {isLowConfidence ? (
                  <div className="flex items-center gap-2.5 text-orange-800 font-black text-lg py-1">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <span>{isUrdu ? 'ڈاکٹر یا فارماسسٹ سے خوراک پوچھیں' : 'Ask your pharmacist for dosage'}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                      {med.dose || (isUrdu ? '1 گولی' : '1 Tablet / Unit')}
                    </span>
                    {med.frequency && (
                      <span className="text-base font-black text-teal-950 bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-300">
                        {med.frequency}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* VISUAL DAY TIMELINE: ☀️ Morning, 🌤️ Afternoon, 🌙 Night */}
              <div className="mb-6">
                <span className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-700 stroke-[2.5]" />
                  <span>{t.dailySchedule}</span>
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Morning */}
                  <div
                    className={`p-3.5 rounded-2xl border-4 flex flex-col items-center justify-center text-center transition-all ${
                      medTimings.includes('morning')
                        ? 'bg-amber-100 border-amber-500 text-amber-950 font-black shadow-md ring-3 ring-amber-400/50'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                    }`}
                  >
                    <span className="text-4xl mb-1">☀️</span>
                    <span className="text-base font-black leading-tight">
                      {t.morning}
                    </span>
                    <span className="text-xs sm:text-sm font-black mt-1 px-2 py-0.5 rounded-md bg-white/80">
                      {medTimings.includes('morning')
                        ? (isUrdu ? 'لینی ہے' : 'TAKE')
                        : (isUrdu ? 'نہیں' : '—')}
                    </span>
                  </div>

                  {/* Afternoon */}
                  <div
                    className={`p-3.5 rounded-2xl border-4 flex flex-col items-center justify-center text-center transition-all ${
                      medTimings.includes('afternoon')
                        ? 'bg-orange-100 border-orange-500 text-orange-950 font-black shadow-md ring-3 ring-orange-400/50'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                    }`}
                  >
                    <span className="text-4xl mb-1">🌤️</span>
                    <span className="text-base font-black leading-tight">
                      {t.afternoon}
                    </span>
                    <span className="text-xs sm:text-sm font-black mt-1 px-2 py-0.5 rounded-md bg-white/80">
                      {medTimings.includes('afternoon')
                        ? (isUrdu ? 'لینی ہے' : 'TAKE')
                        : (isUrdu ? 'نہیں' : '—')}
                    </span>
                  </div>

                  {/* Night */}
                  <div
                    className={`p-3.5 rounded-2xl border-4 flex flex-col items-center justify-center text-center transition-all ${
                      medTimings.includes('night')
                        ? 'bg-indigo-100 border-indigo-600 text-indigo-950 font-black shadow-md ring-3 ring-indigo-400/50'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                    }`}
                  >
                    <span className="text-4xl mb-1">🌙</span>
                    <span className="text-base font-black leading-tight">
                      {t.night}
                    </span>
                    <span className="text-xs sm:text-sm font-black mt-1 px-2 py-0.5 rounded-md bg-white/80">
                      {medTimings.includes('night')
                        ? (isUrdu ? 'لینی ہے' : 'TAKE')
                        : (isUrdu ? 'نہیں' : '—')}
                    </span>
                  </div>
                </div>
              </div>

              {/* FOOD INSTRUCTION ICON & BADGE */}
              <div className="mb-6 bg-amber-50 border-3 border-amber-300 rounded-3xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-3xl shrink-0 border border-amber-300">
                    🍽️
                  </div>
                  <div>
                    <span className="block text-xs font-black text-amber-900 uppercase tracking-wide">
                      {t.foodInstruction}
                    </span>
                    <span className="block text-xl sm:text-2xl font-black text-amber-950 mt-0.5">
                      {med.with_food === 'before'
                        ? t.beforeFood
                        : med.with_food === 'after'
                        ? t.afterFood
                        : med.with_food === 'with'
                        ? t.withFood
                        : t.unspecifiedFood}
                    </span>
                  </div>
                </div>
                <Utensils className="w-7 h-7 text-amber-700/60 stroke-[2.5]" />
              </div>

              {/* FALLBACK NOTICE: If Urdu voice was missing */}
              {hasFallbackNotice && (
                <div className="mb-5 p-4 bg-blue-50 border-3 border-blue-300 rounded-3xl text-blue-950 text-sm font-bold flex items-start gap-3 animate-in fade-in">
                  <Info className="w-6 h-6 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-base">{t.urduVoiceFallbackNotice}</p>
                    {cachedData?.englishFallback && (
                      <p className="text-slate-700 mt-1 italic text-base">
                        "{cachedData.englishFallback}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* SPOKEN SENTENCES CAPTION BOX */}
              {cachedData?.text && (
                <div className="mb-6 bg-teal-50 border-3 border-teal-300 rounded-3xl p-5 animate-in fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-teal-900 flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-teal-700" />
                      <span>{isUrdu ? 'آواز کے الفاظ:' : 'Spoken Voice Message:'}</span>
                    </span>
                    <span className="text-xs font-black text-teal-800 bg-white px-2.5 py-1 rounded-full border border-teal-300">
                      {t.speechRateLabel}
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-950 leading-relaxed">
                    "{cachedData.text}"
                  </p>
                </div>
              )}

              {/* PRIMARY ACTION BUTTONS: 🔊 LISTEN & ✏️ EDIT & 💾 SAVE */}
              <div className="space-y-3.5">
                {/* BIG LISTEN BUTTON */}
                <button
                  onClick={() => handleListen(med, index)}
                  disabled={isLoadingAudio}
                  className={`w-full min-h-[88px] py-5 px-6 rounded-3xl font-black text-2xl sm:text-3xl flex items-center justify-center gap-4 border-4 transition-all active-press shadow-xl ${
                    isPlaying
                      ? 'bg-orange-500 hover:bg-orange-600 border-orange-700 text-white animate-pulse'
                      : 'bg-teal-600 hover:bg-teal-700 border-teal-400 text-white shadow-teal-700/30'
                  }`}
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-9 h-9 animate-spin" />
                      <span>{isUrdu ? 'آواز تیار ہو رہی ہے...' : 'Preparing Voice...'}</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Square className="w-8 h-8 fill-white" />
                      <span>{t.stopAudioBtn}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-10 h-10 stroke-[3]" />
                      <span>{t.listenBtn}</span>
                    </>
                  )}
                </button>

                {/* EDIT BUTTON (FOR CAREGIVER) */}
                <button
                  onClick={() => setEditingIndex(index)}
                  className="w-full min-h-[64px] py-4 px-5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-xl rounded-2xl border-3 border-slate-300 flex items-center justify-center gap-3 active-press"
                >
                  <Edit3 className="w-6 h-6 text-slate-700 stroke-[2.5]" />
                  <span>{t.editBtn}</span>
                </button>

                {/* SAVE BUTTON */}
                <button
                  onClick={() => handleSave(med, index)}
                  disabled={isSaved}
                  className={`w-full min-h-[68px] py-4 px-5 rounded-2xl font-black text-xl sm:text-2xl flex items-center justify-center gap-3 border-3 transition-all active-press ${
                    isSaved
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 cursor-default'
                      : 'bg-white hover:bg-teal-50 border-teal-600 text-teal-900 shadow-md'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle className="w-7 h-7 text-emerald-700 stroke-[3]" />
                      <span>{t.savedSuccess}</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-7 h-7 text-teal-700 stroke-[2.8]" />
                      <span>{t.saveBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingIndex !== null && medicines[editingIndex] && (
        <EditMedicineModal
          medicine={medicines[editingIndex]}
          language={language}
          onSave={handleEditSave}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </div>
  );
};
