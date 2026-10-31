import React, { useState } from 'react';
import { Medicine, Language, Timing, WithFood, Confidence } from '../types';
import { translations } from '../translations';
import { X, Check, Pill } from 'lucide-react';

interface EditMedicineModalProps {
  medicine: Medicine;
  language: Language;
  onSave: (updatedMed: Medicine) => void;
  onClose: () => void;
}

export const EditMedicineModal: React.FC<EditMedicineModalProps> = ({
  medicine,
  language,
  onSave,
  onClose,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  const [brandName, setBrandName] = useState(medicine.brand_name || '');
  const [genericName, setGenericName] = useState(medicine.generic_name || '');
  const [strength, setStrength] = useState(medicine.strength || '');
  const [dose, setDose] = useState(medicine.dose || '');
  const [frequency, setFrequency] = useState(medicine.frequency || '');
  const [timing, setTiming] = useState<Timing[]>(medicine.timing || ['morning']);
  const [withFood, setWithFood] = useState<WithFood>(medicine.with_food || 'unspecified');
  const [confidence, setConfidence] = useState<Confidence>(medicine.confidence || 'high');
  const [unclearParts, setUnclearParts] = useState(medicine.unclear_parts || '');

  const toggleTiming = (slot: Timing) => {
    if (timing.includes(slot)) {
      setTiming(timing.filter((t) => t !== slot));
    } else {
      setTiming([...timing, slot]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Medicine = {
      ...medicine,
      brand_name: brandName.trim() || 'Medicine',
      generic_name: genericName.trim(),
      strength: strength.trim(),
      dose: dose.trim(),
      frequency: frequency.trim(),
      timing: timing.length > 0 ? timing : ['morning'],
      with_food: withFood,
      confidence,
      unclear_parts: unclearParts.trim(),
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto shadow-2xl border-t-4 sm:border-4 border-teal-300 ${
          isUrdu ? 'font-urdu' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center border-2 border-teal-300">
              <Pill className="w-7 h-7 rotate-45 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-950 leading-tight">
                {t.editModalTitle}
              </h3>
              <p className="text-sm text-slate-600 font-bold">
                {t.editModalHelp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 active-press border-2 border-slate-200"
            aria-label="Close"
          >
            <X className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Form - Larger Inputs */}
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-black text-slate-900 mb-1.5">
              {t.brandName}
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full text-xl font-bold px-4 py-3.5 rounded-2xl border-3 border-slate-300 focus:border-teal-500 focus:bg-teal-50/20"
              placeholder="e.g. Amoxil, Panadol, Disprin"
            />
          </div>

          <div>
            <label className="block text-base font-black text-slate-900 mb-1.5">
              {t.genericName}
            </label>
            <input
              type="text"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              className="w-full text-xl font-bold px-4 py-3.5 rounded-2xl border-3 border-slate-300 focus:border-teal-500 focus:bg-teal-50/20"
              placeholder="e.g. Amoxicillin, Aspirin, Warfarin"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-base font-black text-slate-900 mb-1.5">
                {t.strength}
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full text-xl font-bold px-4 py-3.5 rounded-2xl border-3 border-slate-300 focus:border-teal-500 focus:bg-teal-50/20"
                placeholder="e.g. 500mg, 10mg"
              />
            </div>

            <div>
              <label className="block text-base font-black text-slate-900 mb-1.5">
                {t.dose}
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full text-xl font-bold px-4 py-3.5 rounded-2xl border-3 border-slate-300 focus:border-teal-500 focus:bg-teal-50/20"
                placeholder="e.g. 1 tablet, 2 puffs"
              />
            </div>
          </div>

          {/* Timings Toggle - Large Buttons */}
          <div>
            <label className="block text-base font-black text-slate-900 mb-2">
              {t.dailySchedule}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => toggleTiming('morning')}
                className={`py-4 px-2 rounded-2xl border-3 font-black text-base flex flex-col items-center gap-1 transition-all active-press ${
                  timing.includes('morning')
                    ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="text-3xl">☀️</span>
                <span>{t.morning}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleTiming('afternoon')}
                className={`py-4 px-2 rounded-2xl border-3 font-black text-base flex flex-col items-center gap-1 transition-all active-press ${
                  timing.includes('afternoon')
                    ? 'bg-orange-100 border-orange-500 text-orange-950 shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="text-3xl">🌤️</span>
                <span>{t.afternoon}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleTiming('night')}
                className={`py-4 px-2 rounded-2xl border-3 font-black text-base flex flex-col items-center gap-1 transition-all active-press ${
                  timing.includes('night')
                    ? 'bg-indigo-100 border-indigo-600 text-indigo-950 shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="text-3xl">🌙</span>
                <span>{t.night}</span>
              </button>
            </div>
          </div>

          {/* Food Instructions */}
          <div>
            <label className="block text-base font-black text-slate-900 mb-2">
              {t.foodInstruction}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setWithFood('before')}
                className={`min-h-[56px] py-3 px-3 rounded-2xl border-3 font-black text-sm text-center active-press ${
                  withFood === 'before'
                    ? 'bg-teal-100 border-teal-600 text-teal-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                🍽️ {t.beforeFood}
              </button>
              <button
                type="button"
                onClick={() => setWithFood('after')}
                className={`min-h-[56px] py-3 px-3 rounded-2xl border-3 font-black text-sm text-center active-press ${
                  withFood === 'after'
                    ? 'bg-teal-100 border-teal-600 text-teal-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                🍽️ {t.afterFood}
              </button>
              <button
                type="button"
                onClick={() => setWithFood('with')}
                className={`min-h-[56px] py-3 px-3 rounded-2xl border-3 font-black text-sm text-center active-press ${
                  withFood === 'with'
                    ? 'bg-teal-100 border-teal-600 text-teal-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                🍽️ {t.withFood}
              </button>
              <button
                type="button"
                onClick={() => setWithFood('unspecified')}
                className={`min-h-[56px] py-3 px-3 rounded-2xl border-3 font-black text-sm text-center active-press ${
                  withFood === 'unspecified'
                    ? 'bg-teal-100 border-teal-600 text-teal-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                💧 {t.unspecifiedFood}
              </button>
            </div>
          </div>

          {/* Confidence Setting */}
          <div>
            <label className="block text-base font-black text-slate-900 mb-1.5">
              {isUrdu ? 'وضاحت اور اعتماد' : 'Reading Confidence'}
            </label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as Confidence)}
              className="w-full text-lg font-bold px-4 py-3.5 rounded-2xl border-3 border-slate-300 focus:border-teal-500"
            >
              <option value="high">{isUrdu ? 'مکمل واضح (ہائی)' : 'High (All details clear)'}</option>
              <option value="medium">{isUrdu ? 'درمیانہ (میڈیم)' : 'Medium (Mostly clear)'}</option>
              <option value="low">{isUrdu ? 'غیر واضح (لو وارننگ جاری رکھیں)' : 'Low (Show pharmacist warning banner)'}</option>
            </select>
          </div>

          {confidence === 'low' && (
            <div>
              <label className="block text-sm font-black text-amber-900 mb-1">
                {t.unclearParts}
              </label>
              <input
                type="text"
                value={unclearParts}
                onChange={(e) => setUnclearParts(e.target.value)}
                className="w-full text-base font-bold px-4 py-3 rounded-2xl border-2 border-amber-400 bg-amber-50 text-amber-950"
                placeholder="e.g. Dose was handwritten and faint"
              />
            </div>
          )}

          {/* Actions - Extra Large Buttons */}
          <div className="pt-4 flex gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[64px] py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xl rounded-2xl border-2 border-slate-300 active-press"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-2 min-h-[64px] py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-teal-700/25 active-press flex items-center justify-center gap-2.5 border-2 border-teal-400"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>{t.saveChanges}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
