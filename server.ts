import express from 'express';
type Request = express.Request;
type Response = express.Response;
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support base64 image uploads up to 25MB
app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const scanSystemInstruction = `You read photos of medicine packaging and prescriptions for elderly and low-literacy patients.
Rules:
- Only report what is clearly visible. Never guess a drug name, dose, or frequency.
- Expand abbreviations only when clearly written: OD = once daily, BD = twice daily, TDS = three times daily, HS = at bedtime, SOS = only when needed.
- If anything is unclear, set confidence to "low" and explain what is unclear.
- Give the generic (active ingredient) name if it is printed or if the brand is very well known.
Return JSON only.`;

const scanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      enum: ['prescription', 'medicine_package', 'unknown'],
    },
    medicines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          brand_name: { type: Type.STRING },
          generic_name: { type: Type.STRING },
          strength: { type: Type.STRING },
          dose: { type: Type.STRING },
          frequency: { type: Type.STRING },
          timing: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              enum: ['morning', 'afternoon', 'night'],
            },
          },
          with_food: {
            type: Type.STRING,
            enum: ['before', 'after', 'with', 'unspecified'],
          },
          duration: { type: Type.STRING },
          confidence: {
            type: Type.STRING,
            enum: ['high', 'medium', 'low'],
          },
          unclear_parts: { type: Type.STRING },
        },
        required: [
          'brand_name',
          'generic_name',
          'strength',
          'dose',
          'frequency',
          'timing',
          'with_food',
          'confidence',
        ],
      },
    },
    overall_confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
    },
  },
  required: ['document_type', 'medicines', 'overall_confidence'],
};

// POST /api/scan-medicine
app.post('/api/scan-medicine', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: 'Analyze this medicine packaging or prescription carefully. Extract all medicines according to the specified rules.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: scanSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: scanResponseSchema,
      },
    });

    const rawText = (response.text || '{}').trim();
    let cleanText = rawText;
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (parseErr) {
      console.warn('Direct JSON parse failed, trying regex match:', parseErr);
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw parseErr;
      }
    }

    // Ensure medicines array is valid
    if (!parsedData || typeof parsedData !== 'object') {
      parsedData = {
        document_type: 'unknown',
        medicines: [],
        overall_confidence: 'low',
      };
    }
    if (!Array.isArray(parsedData.medicines)) {
      parsedData.medicines = [];
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error scanning medicine:', error);
    return res.status(500).json({
      error: 'Could not read this photo. Please take a clearer photo in good light.',
      details: error.message,
    });
  }
});

// POST /api/generate-spoken-summary
app.post('/api/generate-spoken-summary', async (req: Request, res: Response) => {
  try {
    const { medicine, language = 'en' } = req.body;
    if (!medicine) {
      return res.status(400).json({ error: 'Medicine data is required' });
    }

    const isUrdu = language === 'ur';

    const systemPrompt = `You create spoken instructions for elderly and low-literacy patients.
Keep sentences very short, reassuring, and extremely simple.
Mention the medicine name, the exact dose, when to take it (morning, afternoon, or night), and whether before or after food.
If confidence is low, kindly remind them to ask their pharmacist or doctor.
Never use medical jargon. Exactly 2 or 3 sentences total.`;

    const medicineSummary = `Name: ${medicine.brand_name || medicine.generic_name}
Generic active ingredient: ${medicine.generic_name || 'Not specified'}
Strength: ${medicine.strength || ''}
Dose: ${medicine.dose || '1 dose'}
Frequency: ${medicine.frequency || 'As advised'}
Timing: ${Array.isArray(medicine.timing) ? medicine.timing.join(', ') : 'As needed'}
Food instruction: ${medicine.with_food} food
Confidence: ${medicine.confidence || 'high'}`;

    if (isUrdu) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Explain how to take this medicine for an elderly patient:
${medicineSummary}

Provide:
1. spoken_text: 2-3 very simple spoken sentences in Urdu (Urdu script).
2. english_fallback: The same 2-3 simple sentences in English (for speech synthesis fallback if device has no Urdu voice).`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spoken_text: {
                type: Type.STRING,
                description: '2-3 simple spoken sentences in Urdu script',
              },
              english_fallback: {
                type: Type.STRING,
                description: '2-3 simple spoken sentences in English',
              },
            },
            required: ['spoken_text', 'english_fallback'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        text: parsed.spoken_text || 'یہ آپ کی دوا ہے۔ اسے ڈاکٹر کی ہدایت کے مطابق لیں۔',
        englishFallback: parsed.english_fallback || `Take ${medicine.brand_name || 'your medicine'} as directed by your doctor.`,
      });
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Explain how to take this medicine for an elderly patient in 2-3 very simple sentences in English:
${medicineSummary}`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spoken_text: {
                type: Type.STRING,
                description: '2-3 simple spoken sentences in English',
              },
            },
            required: ['spoken_text'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        text: parsed.spoken_text || `Take ${medicine.brand_name || 'your medicine'} as directed by your doctor.`,
        englishFallback: parsed.spoken_text || `Take ${medicine.brand_name || 'your medicine'} as directed by your doctor.`,
      });
    }
  } catch (error: any) {
    console.error('Error generating spoken summary:', error);
    const medName = req.body?.medicine?.brand_name || req.body?.medicine?.generic_name || 'your medicine';
    const isUrdu = req.body?.language === 'ur';
    const urduFallback = `یہ دوا ${medName} ہے۔ اسے اپنے ڈاکٹر کی ہدایت کے مطابق پانی کے ساتھ لیں۔`;
    const englishFallback = `Take ${medName} as directed by your doctor with water.`;
    return res.json({
      text: isUrdu ? urduFallback : englishFallback,
      englishFallback: englishFallback,
    });
  }
});

// Setup dev server with Vite middlewares, or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedLens full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
