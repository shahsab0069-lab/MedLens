import { Medicine, InteractionAlert, DuplicateAlert } from './types';
import { KNOWN_INTERACTIONS } from './constants';

const STORAGE_KEY = 'medlens_saved_medicines_v1';

export function getSavedMedicines(): Medicine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Failed to read medicines from localStorage:', error);
    return [];
  }
}

export function saveMedicine(medicine: Medicine): { success: boolean; list: Medicine[] } {
  try {
    const current = getSavedMedicines();
    // Generate an ID if missing
    const medToSave: Medicine = {
      ...medicine,
      id: medicine.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      savedAt: medicine.savedAt || new Date().toISOString(),
    };

    // Check if item with same ID exists, update it; otherwise append
    const existingIndex = current.findIndex(m => m.id === medToSave.id);
    let updated: Medicine[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = medToSave;
    } else {
      updated = [medToSave, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true, list: updated };
  } catch (error) {
    console.error('Failed to save medicine to localStorage:', error);
    return { success: false, list: getSavedMedicines() };
  }
}

export function deleteMedicine(id: string): Medicine[] {
  try {
    const current = getSavedMedicines();
    const filtered = current.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Failed to delete medicine from localStorage:', error);
    return getSavedMedicines();
  }
}

// Check if a medicine matches a target drug name
// Matches generic names in lowercase and also checks if the generic name contains the word
// (for example "aspirin 75mg" matches "aspirin")
export function medicineMatchesDrug(med: Medicine, targetDrug: string): boolean {
  if (!med || !targetDrug) return false;
  const target = targetDrug.toLowerCase().trim();

  const genericLower = (med.generic_name || '').toLowerCase();
  const brandLower = (med.brand_name || '').toLowerCase();

  // Match in lowercase and check if generic or brand name contains the word
  if (genericLower.includes(target) || brandLower.includes(target)) {
    return true;
  }

  // Also check cleaned word tokens and punctuation removal
  const cleanGeneric = genericLower.replace(/[^a-z0-9]/g, ' ');
  const cleanBrand = brandLower.replace(/[^a-z0-9]/g, ' ');

  if (cleanGeneric.includes(target) || cleanBrand.includes(target)) {
    return true;
  }

  // Common clinical alias: Aspirin is often written as acetylsalicylic acid
  if (
    target === 'aspirin' &&
    (genericLower.includes('acetylsalicylic') || brandLower.includes('acetylsalicylic'))
  ) {
    return true;
  }

  return false;
}

// Check for drug interactions from the known list
export function checkInteractions(medicines: Medicine[]): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];
  if (!medicines || medicines.length < 2) return alerts;

  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const medA = medicines[i];
      const medB = medicines[j];

      for (const rule of KNOWN_INTERACTIONS) {
        const matchesStraight =
          medicineMatchesDrug(medA, rule.a) && medicineMatchesDrug(medB, rule.b);
        const matchesReverse =
          medicineMatchesDrug(medA, rule.b) && medicineMatchesDrug(medB, rule.a);

        if (matchesStraight || matchesReverse) {
          const idA = medA.id || medA.brand_name || medA.generic_name;
          const idB = medB.id || medB.brand_name || medB.generic_name;
          const pairKey = [idA, idB].sort().join('___');

          const alreadyAdded = alerts.some((a: any) => a._key === pairKey);

          if (!alreadyAdded) {
            alerts.push({
              medA: medA.brand_name || medA.generic_name || rule.a,
              medB: medB.brand_name || medB.generic_name || rule.b,
              genericA: medA.generic_name || medA.brand_name,
              genericB: medB.generic_name || medB.brand_name,
              message: rule.msg,
              messageUrdu: rule.msgUrdu,
              ...({ _key: pairKey } as any),
            });
          }
        }
      }
    }
  }

  return alerts;
}

// Check if a single medicine interacts with any medicine in a saved list
export function checkSingleMedicineInteractions(
  targetMed: Medicine,
  savedList: Medicine[]
): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];
  if (!targetMed || !savedList || savedList.length === 0) return alerts;

  for (const savedMed of savedList) {
    if (savedMed.id === targetMed.id) continue;

    for (const rule of KNOWN_INTERACTIONS) {
      const matchesStraight =
        medicineMatchesDrug(targetMed, rule.a) && medicineMatchesDrug(savedMed, rule.b);
      const matchesReverse =
        medicineMatchesDrug(targetMed, rule.b) && medicineMatchesDrug(savedMed, rule.a);

      if (matchesStraight || matchesReverse) {
        alerts.push({
          medA: targetMed.brand_name || targetMed.generic_name || rule.a,
          medB: savedMed.brand_name || savedMed.generic_name || rule.b,
          genericA: targetMed.generic_name || targetMed.brand_name,
          genericB: savedMed.generic_name || savedMed.brand_name,
          message: rule.msg,
          messageUrdu: rule.msgUrdu,
        });
      }
    }
  }

  return alerts;
}

// Check for duplicate generic ingredients across saved medicines
export function checkDuplicateIngredients(medicines: Medicine[]): DuplicateAlert[] {
  const alerts: DuplicateAlert[] = [];
  if (!medicines || medicines.length < 2) return alerts;

  const genericMap = new Map<string, Medicine[]>();

  for (const med of medicines) {
    const rawGeneric = (med.generic_name || '').trim();
    if (!rawGeneric) continue;
    const norm = rawGeneric.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (norm.length < 3) continue; // skip very short junk

    const existing = genericMap.get(norm) || [];
    existing.push(med);
    genericMap.set(norm, existing);
  }

  for (const [, meds] of genericMap.entries()) {
    if (meds.length > 1) {
      alerts.push({
        genericName: meds[0].generic_name,
        medicines: meds.map(m => m.brand_name || m.generic_name),
      });
    }
  }

  return alerts;
}
