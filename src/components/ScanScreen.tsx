import React, { useState, useRef, useEffect } from 'react';
import { Language, ScanResult } from '../types';
import { translations } from '../translations';
import { SAMPLE_MEDICINE_PHOTOS } from '../constants';
import {
  Camera,
  Upload,
  RefreshCw,
  X,
  AlertCircle,
  Pill,
  Sparkles,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface ScanScreenProps {
  language: Language;
  onBack: () => void;
  onScanComplete: (result: ScanResult, imagePreviewUrl?: string) => void;
  initialImage?: string | null;
  initialResult?: ScanResult | null;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  language,
  onBack,
  onScanComplete,
  initialImage = null,
  initialResult = null,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // If initial image/result passed (from demo sample), animate and show cards
  useEffect(() => {
    if (initialResult) {
      setIsAnalyzing(true);
      setAnalysisStep(1);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        onScanComplete(initialResult, initialImage || undefined);
      }, 1100);
      return () => clearTimeout(timer);
    } else if (initialImage) {
      processImage(initialImage);
    }
  }, [initialImage, initialResult]);

  // Bind stream to video element when camera becomes active
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video play interrupted:', err);
      });
    }
  }, [cameraActive]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);

    // Defensive check: navigator.mediaDevices may not be present in restricted iframes or insecure origins
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setCameraError(
        isUrdu
          ? 'کیمرہ اس براؤزر میں دستیاب نہیں ہے۔ آپ نیچے دی گئی بٹن سے گیلری یا تصویر اپ لوڈ کر سکتے ہیں۔'
          : 'Camera is not supported or permitted in this browser frame. Please use "Upload Picture" below.'
      );
      setCameraActive(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraActive(true);

      // If video element is already mounted, attach immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((playErr) => {
          console.warn('Immediate video play error:', playErr);
        });
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        isUrdu
          ? 'کیمرہ کھولنے میں دشواری ہے۔ آپ نیچے گیلری سے تصویر منتخب کر سکتے ہیں۔'
          : 'Could not access camera. Please use picture upload below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setImagePreview(dataUrl);
      processImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      stopCamera();
      setImagePreview(result);
      processImage(result);
    };
    reader.readAsDataURL(file);
    // Reset file input value so selecting the same file again works
    e.target.value = '';
  };

  const processImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep(1);

    // Progress step animation for friendly patient feedback
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch('/api/scan-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: 'image/jpeg',
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || t.couldNotReadPhoto);
      }

      const scanResult: ScanResult = await response.json();

      // If document is unknown or has no recognizable medicines, treat as unreadable photo
      const hasRecognizableMedicine =
        scanResult.medicines &&
        scanResult.medicines.length > 0 &&
        scanResult.medicines.some(
          (m) =>
            m.brand_name &&
            !m.brand_name.toLowerCase().includes('unknown') &&
            !m.brand_name.toLowerCase().includes('unidentified') &&
            !m.brand_name.toLowerCase().includes('نامعلوم')
        );

      if (!hasRecognizableMedicine) {
        throw new Error(t.couldNotReadPhoto);
      }

      onScanComplete(scanResult, base64Image);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Scan error:', err);
      setErrorMessage(t.couldNotReadPhoto);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`p-4 pb-14 max-w-md mx-auto w-full ${isUrdu ? 'font-urdu' : ''}`}>
      {/* Top Navigation - Bigger & Tactile */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-lg transition-colors active-press shadow-xs"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3]" />
          <span>{isUrdu ? 'واپس' : 'Back'}</span>
        </button>

        <h2 className="text-2xl font-black text-slate-950 tracking-tight">
          {t.scanTitle}
        </h2>

        <div className="w-12" /> {/* spacer */}
      </div>

      {/* Analyzing / Loading State (Friendly Animation) */}
      {isAnalyzing && (
        <div className="bg-white rounded-3xl p-8 border-4 border-teal-300 shadow-2xl text-center my-4 animate-in fade-in duration-300">
          {/* Animated Friendly Pill */}
          <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-teal-400/20 rounded-full animate-ping" />
            <div className="absolute inset-2 bg-teal-500/10 rounded-full animate-pulse" />
            <div className="w-24 h-24 bg-linear-to-tr from-teal-600 to-teal-400 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-500/30 transform animate-bounce">
              <Pill className="w-14 h-14 text-white stroke-[2.8] rotate-45" />
            </div>
          </div>

          <h3 className="text-3xl font-black text-teal-950 mb-3">
            {t.readingMedicine}
          </h3>
          <p className="text-slate-800 font-extrabold text-xl mb-6 leading-relaxed">
            {analysisStep === 1
              ? (isUrdu ? 'تصویر کا معائنہ ہو رہا ہے...' : 'Looking at medicine label...')
              : analysisStep === 2
              ? (isUrdu ? 'نام، خوراک اور اوقات چیک ہو رہے ہیں...' : 'Checking dosage & daily times...')
              : (isUrdu ? 'آواز کی ہدایات تیار کی جا رہی ہیں...' : 'Preparing clear spoken instructions...')}
          </p>

          {/* Simple 3-step visual dots */}
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <div className={`h-2.5 rounded-full transition-all duration-300 ${analysisStep >= 1 ? 'w-8 bg-teal-600' : 'w-2.5 bg-slate-200'}`} />
            <div className={`h-2.5 rounded-full transition-all duration-300 ${analysisStep >= 2 ? 'w-8 bg-teal-600' : 'w-2.5 bg-slate-200'}`} />
            <div className={`h-2.5 rounded-full transition-all duration-300 ${analysisStep >= 3 ? 'w-8 bg-teal-600' : 'w-2.5 bg-slate-200'}`} />
          </div>

          {imagePreview && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-3">
              <img
                src={imagePreview}
                alt="Scanning target"
                className="w-16 h-16 object-cover rounded-xl border-2 border-teal-300 shadow-xs"
              />
              <span className="text-xs font-bold text-teal-800">
                {isUrdu ? 'تصویر پروسیس ہو رہی ہے' : 'Analyzing scanned photo'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Normal Camera / Capture View */}
      {!isAnalyzing && (
        <div className="space-y-4">
          {/* Viewfinder Card */}
          <div className="relative w-full aspect-4/3 bg-slate-900 rounded-3xl overflow-hidden border-4 border-teal-500 shadow-xl flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Target bounding box */}
                <div className="absolute inset-8 border-2 border-dashed border-teal-300/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-t-4 border-l-4 border-teal-400" />
                    <div className="w-5 h-5 border-t-4 border-r-4 border-teal-400" />
                  </div>
                  <p className="text-center text-xs font-bold text-white bg-black/50 py-1 px-3 rounded-full mx-auto backdrop-blur-xs">
                    {isUrdu ? 'دوا کو اس دائرے میں رکھیں' : 'Place medicine box inside frame'}
                  </p>
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-b-4 border-l-4 border-teal-400" />
                    <div className="w-5 h-5 border-b-4 border-r-4 border-teal-400" />
                  </div>
                </div>

                {/* Laser scan line animation */}
                <div className="absolute left-8 right-8 h-1 bg-linear-to-r from-transparent via-teal-400 to-transparent shadow-lg shadow-teal-400 animate-scan-laser pointer-events-none" />

                {/* Camera Flip Button */}
                <button
                  onClick={toggleCameraFacing}
                  className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 text-white rounded-2xl backdrop-blur-md active-press"
                  aria-label={t.switchCamera}
                  title={t.switchCamera}
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              </>
            ) : imagePreview ? (
              <div className="relative w-full h-full">
                <img
                  src={imagePreview}
                  alt="Captured Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-4 right-4 p-2.5 bg-black/70 hover:bg-black/90 text-white rounded-2xl backdrop-blur-md active-press"
                  aria-label="Remove image"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-300">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-800 text-teal-400 flex items-center justify-center border border-slate-700">
                  <Camera className="w-9 h-9 stroke-[2]" />
                </div>
                <p className="text-base font-bold text-white mb-1">
                  {t.scanSubtitle}
                </p>
                <p className="text-xs text-slate-400">
                  {isUrdu ? 'روشنی اچھی رکھیں تاکہ تمام الفاظ واضح ہوں' : 'Clear lighting gives the most accurate dose'}
                </p>
              </div>
            )}
          </div>

          {/* Camera Error Message if any */}
          {cameraError && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-amber-900 text-sm font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Friendly Unreadable Photo Card with Try Again button */}
          {errorMessage && (
            <div className="bg-amber-50 rounded-3xl p-6 border-4 border-amber-400 shadow-xl text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center border-2 border-amber-300 shadow-xs">
                <AlertCircle className="w-10 h-10 stroke-[2.8]" />
              </div>

              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-black text-amber-950 leading-snug">
                  "{t.couldNotReadPhoto}"
                </p>
              </div>

              {/* Big Try Again Button */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setImagePreview(null);
                  setIsAnalyzing(false);
                  startCamera('environment');
                }}
                className="w-full min-h-[68px] py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black text-2xl rounded-2xl shadow-lg shadow-teal-700/25 flex items-center justify-center gap-3 border-2 border-teal-400 active-press"
              >
                <RefreshCw className="w-7 h-7 stroke-[3]" />
                <span>{t.tryAgain}</span>
              </button>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-2">
            {cameraActive ? (
              <button
                onClick={captureCameraPhoto}
                className="w-full min-h-[88px] py-5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black text-2xl sm:text-3xl rounded-3xl shadow-xl shadow-teal-700/30 flex items-center justify-center gap-3.5 border-4 border-teal-400 active-press"
              >
                <Camera className="w-9 h-9 stroke-[3]" />
                <span>{t.captureButton}</span>
              </button>
            ) : (
              <button
                onClick={() => startCamera('environment')}
                className="w-full min-h-[88px] py-5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black text-2xl sm:text-3xl rounded-3xl shadow-xl shadow-teal-700/30 flex items-center justify-center gap-3.5 border-4 border-teal-400 active-press"
              >
                <Camera className="w-9 h-9 stroke-[3]" />
                <span>{t.useCamera}</span>
              </button>
            )}

            {/* Gallery Upload Button - Extra Large */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                id="medlens-file-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[76px] py-4 px-6 bg-white hover:bg-slate-50 text-slate-950 font-black text-2xl rounded-3xl border-4 border-slate-300 shadow-md flex items-center justify-center gap-3.5 active-press"
              >
                <Upload className="w-8 h-8 text-orange-600 stroke-[3]" />
                <span>{t.uploadPhoto}</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Samples Selector */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-600 mb-2.5 text-center">
              {t.orTrySample}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_MEDICINE_PHOTOS.slice(0, 3).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    stopCamera();
                    setImagePreview(sample.image);
                    if (sample.sampleResult) {
                      setIsAnalyzing(true);
                      setTimeout(() => {
                        setIsAnalyzing(false);
                        onScanComplete(sample.sampleResult, sample.image);
                      }, 1000);
                    } else {
                      processImage(sample.image);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200 text-center active-press"
                >
                  <Pill className="w-5 h-5 text-teal-700 mx-auto mb-1 rotate-45" />
                  <span className="block text-xs font-extrabold text-teal-950 truncate">
                    {sample.name.split(' ')[0]}
                  </span>
                  <span className="block text-[10px] font-bold text-teal-700">
                    {sample.name.split(' ')[1] || 'Sample'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
