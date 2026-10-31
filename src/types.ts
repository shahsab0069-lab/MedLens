export type Language = 'en' | 'ur';

export type Timing = 'morning' | 'afternoon' | 'night';

export type WithFood = 'before' | 'after' | 'with' | 'unspecified';

export type Confidence = 'high' | 'medium' | 'low';

export interface Medicine {
  id?: string;
  brand_name: string;
  generic_name: string;
  strength: string;
  dose: string;
  frequency: string;
  timing: Timing[];
  with_food: WithFood;
  duration?: string;
  confidence: Confidence;
  unclear_parts?: string;
  savedAt?: string;
  spokenAudioText?: string;
}

export interface ScanResult {
  document_type: 'prescription' | 'medicine_package' | 'unknown';
  medicines: Medicine[];
  overall_confidence: Confidence;
}

export interface InteractionRule {
  a: string;
  b: string;
  msg: string;
  msgUrdu?: string;
}

export interface InteractionAlert {
  medA: string;
  medB: string;
  genericA: string;
  genericB: string;
  message: string;
  messageUrdu?: string;
}

export interface DuplicateAlert {
  genericName: string;
  medicines: string[];
}
