import { InteractionRule, ScanResult } from './types';

export interface SampleMedicine {
  id: string;
  name: string;
  urduName: string;
  type: string;
  image: string;
  sampleResult: ScanResult;
}

export const KNOWN_INTERACTIONS: InteractionRule[] = [
  {
    a: 'warfarin',
    b: 'aspirin',
    msg: 'Bleeding risk. Ask your doctor before taking these together.',
    msgUrdu: 'خون بہنے کا شدید خطرہ۔ ان دونوں کو ایک ساتھ لینے سے پہلے اپنے ڈاکٹر سے رجوع کریں۔',
  },
  {
    a: 'warfarin',
    b: 'ibuprofen',
    msg: 'Bleeding risk. Ask your doctor before taking these together.',
    msgUrdu: 'خون بہنے کا شدید خطرہ۔ ان دونوں کو ایک ساتھ لینے سے پہلے اپنے ڈاکٹر سے رجوع کریں۔',
  },
  {
    a: 'aspirin',
    b: 'ibuprofen',
    msg: "Taking these together can upset the stomach and reduce aspirin's effect.",
    msgUrdu: 'ایک ساتھ لینے سے معدہ خراب ہو سکتا ہے اور ایسپرین کا اثر کم ہو سکتا ہے۔',
  },
  {
    a: 'clopidogrel',
    b: 'omeprazole',
    msg: 'Omeprazole may make clopidogrel less effective.',
    msgUrdu: 'اومیپرازول دوا کلوپیڈوگریل کے اثر کو کم کر سکتی ہے۔',
  },
  {
    a: 'metformin',
    b: 'alcohol',
    msg: 'Avoid alcohol with metformin.',
    msgUrdu: 'میٹفارمین شوگر کی دوا کے ساتھ الکوحل سے سخت پرہیز کریں۔',
  },
  {
    a: 'sildenafil',
    b: 'nitroglycerin',
    msg: 'Dangerous drop in blood pressure. Never take together.',
    msgUrdu: 'بلڈ پریشر میں جان لیوا حد تک کمی ہو سکتی ہے۔ کبھی ایک ساتھ نہ لیں۔',
  },
  {
    a: 'simvastatin',
    b: 'clarithromycin',
    msg: 'Risk of muscle damage. Ask your doctor.',
    msgUrdu: 'پٹھوں کو شدید نقصان پہنچنے کا خطرہ ہے۔ اپنے ڈاکٹر سے پوچھیں۔',
  },
  {
    a: 'lisinopril',
    b: 'spironolactone',
    msg: 'May raise potassium too high. Ask your doctor.',
    msgUrdu: 'خون میں پوٹاشیم بہت زیادہ بڑھ سکتا ہے۔ اپنے ڈاکٹر سے رابطہ کریں۔',
  },
];

// Helper to create realistic medicine box SVG data URIs for quick 1-click testing
export function createMedicineMockImage(brand: string, generic: string, strength: string, color: string, badgeText: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
    <rect width="600" height="110" rx="20" fill="${color}"/>
    <circle cx="60" cy="55" r="28" fill="#ffffff" opacity="0.25"/>
    <path d="M48 55h24M60 43v24" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
    <text x="110" y="52" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="1">PHARMACEUTICAL PACK</text>
    <text x="110" y="82" fill="#ffffff" opacity="0.9" font-family="Arial, sans-serif" font-weight="600" font-size="16">ORAL TABLETS / CAPSULES</text>
    <rect x="440" y="30" width="130" height="48" rx="12" fill="#ffffff"/>
    <text x="505" y="62" fill="${color}" font-family="Arial, sans-serif" font-weight="800" font-size="20" text-anchor="middle">${badgeText}</text>
    
    <text x="50" y="190" fill="#0f172a" font-family="Arial, sans-serif" font-weight="900" font-size="44">${brand}</text>
    <text x="50" y="235" fill="#475569" font-family="Arial, sans-serif" font-weight="700" font-size="24">${generic} ${strength}</text>
    
    <line x1="50" y1="265" x2="550" y2="265" stroke="#e2e8f0" stroke-width="2"/>
    
    <rect x="50" y="290" width="160" height="60" rx="12" fill="#f1f5f9"/>
    <text x="65" y="315" fill="#64748b" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DOSAGE</text>
    <text x="65" y="340" fill="#0f172a" font-family="Arial, sans-serif" font-size="18" font-weight="bold">1 Tablet BD</text>
    
    <rect x="230" y="290" width="180" height="60" rx="12" fill="#f1f5f9"/>
    <text x="245" y="315" fill="#64748b" font-family="Arial, sans-serif" font-size="12" font-weight="bold">INSTRUCTIONS</text>
    <text x="245" y="340" fill="#0f172a" font-family="Arial, sans-serif" font-size="18" font-weight="bold">After Food</text>

    <rect x="430" y="290" width="120" height="60" rx="12" fill="#ecfdf5"/>
    <text x="445" y="315" fill="#059669" font-family="Arial, sans-serif" font-size="12" font-weight="bold">RX ONLY</text>
    <text x="445" y="340" fill="#047857" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Verified</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export const SAMPLE_MEDICINE_PHOTOS: SampleMedicine[] = [
  {
    id: 'sample-amox',
    name: 'Amoxicillin 500mg',
    urduName: 'اموکسیسلن 500 ملی گرام',
    type: 'Antibiotic (Capsule)',
    image: createMedicineMockImage('AMOXIL', 'Amoxicillin', '500mg', '#0d9488', '500 mg'),
    sampleResult: {
      document_type: 'medicine_package',
      overall_confidence: 'high',
      medicines: [
        {
          brand_name: 'Amoxil',
          generic_name: 'Amoxicillin',
          strength: '500mg',
          dose: '1 capsule',
          frequency: 'Twice daily (BD)',
          timing: ['morning', 'night'],
          with_food: 'after',
          confidence: 'high',
          unclear_parts: '',
        },
      ],
    },
  },
  {
    id: 'sample-warfarin',
    name: 'Warfarin 5mg',
    urduName: 'وارفرین 5 ملی گرام',
    type: 'Blood thinner (Tablet)',
    image: createMedicineMockImage('COUMADIN', 'Warfarin', '5mg', '#ea580c', '5 mg'),
    sampleResult: {
      document_type: 'medicine_package',
      overall_confidence: 'high',
      medicines: [
        {
          brand_name: 'Coumadin',
          generic_name: 'Warfarin',
          strength: '5mg',
          dose: '1 tablet',
          frequency: 'Once daily at bedtime (OD)',
          timing: ['night'],
          with_food: 'unspecified',
          confidence: 'high',
          unclear_parts: '',
        },
      ],
    },
  },
  {
    id: 'sample-aspirin',
    name: 'Aspirin 75mg',
    urduName: 'ایسپرین 75 ملی گرام',
    type: 'Pain & heart (Tablet)',
    image: createMedicineMockImage('DISPRIN', 'Aspirin 75mg', '75mg', '#dc2626', '75 mg'),
    sampleResult: {
      document_type: 'medicine_package',
      overall_confidence: 'high',
      medicines: [
        {
          brand_name: 'Disprin',
          generic_name: 'Aspirin 75mg',
          strength: '75mg',
          dose: '1 tablet',
          frequency: 'Once daily after breakfast (OD)',
          timing: ['morning'],
          with_food: 'after',
          confidence: 'high',
          unclear_parts: '',
        },
      ],
    },
  },
  {
    id: 'sample-ibuprofen',
    name: 'Ibuprofen 400mg',
    urduName: 'آئبوپروفین 400 ملی گرام',
    type: 'Pain & inflammation (Tablet)',
    image: createMedicineMockImage('BRUFEN', 'Ibuprofen 400mg', '400mg', '#0284c7', '400 mg'),
    sampleResult: {
      document_type: 'medicine_package',
      overall_confidence: 'high',
      medicines: [
        {
          brand_name: 'Brufen',
          generic_name: 'Ibuprofen 400mg',
          strength: '400mg',
          dose: '1 tablet',
          frequency: 'Twice daily after food (BD)',
          timing: ['morning', 'night'],
          with_food: 'after',
          confidence: 'high',
          unclear_parts: '',
        },
      ],
    },
  },
  {
    id: 'sample-unclear',
    name: 'Prescription (Unclear Dose)',
    urduName: 'نسخہ (غیر واضح خوراک)',
    type: 'Prescription demo with warning',
    image: createMedicineMockImage('AUGMENTIN', 'Amoxicillin + Clavulanate', '625mg', '#d97706', 'Unclear'),
    sampleResult: {
      document_type: 'prescription',
      overall_confidence: 'low',
      medicines: [
        {
          brand_name: 'Augmentin',
          generic_name: 'Amoxicillin + Clavulanate',
          strength: '625mg',
          dose: '',
          frequency: 'Unclear handwriting',
          timing: ['morning', 'night'],
          with_food: 'with',
          confidence: 'low',
          unclear_parts: 'The exact dose and number of tablets are handwritten and faint.',
        },
      ],
    },
  },
];
