/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, Medicine, ScanResult } from './types';
import { getSavedMedicines, saveMedicine, deleteMedicine } from './storage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { ScanScreen } from './components/ScanScreen';
import { ResultScreen } from './components/ResultScreen';
import { MyMedicinesScreen } from './components/MyMedicinesScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'scan' | 'result' | 'saved'>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [savedMedicines, setSavedMedicines] = useState<Medicine[]>([]);
  const [currentScanResult, setCurrentScanResult] = useState<ScanResult | null>(null);
  const [selectedDemoImage, setSelectedDemoImage] = useState<string | null>(null);
  const [selectedDemoResult, setSelectedDemoResult] = useState<ScanResult | null>(null);

  // Load saved medicines on initial render
  useEffect(() => {
    const list = getSavedMedicines();
    setSavedMedicines(list);
  }, []);

  // Sync HTML dir attribute for RTL support when Urdu is selected
  useEffect(() => {
    if (language === 'ur') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ur');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    }
  }, [language]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (typeof window !== 'undefined' && (window as any).MedReminders?.setLanguage) {
      try {
        (window as any).MedReminders.setLanguage(newLang);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleLanguage = () => {
    const nextLang = language === 'en' ? 'ur' : 'en';
    handleLanguageChange(nextLang);
  };

  const handleSaveMedicine = (medicine: Medicine) => {
    const result = saveMedicine(medicine);
    if (result.success) {
      setSavedMedicines(result.list);
      if (typeof window !== 'undefined' && (window as any).MedReminders?.addMedicine) {
        try {
          (window as any).MedReminders.addMedicine({
            name: medicine.brand_name || medicine.generic_name,
            dose: medicine.dose,
            timing: medicine.timing,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleDeleteMedicine = (id: string) => {
    const updated = deleteMedicine(id);
    setSavedMedicines(updated);
  };

  const handleScanComplete = (result: ScanResult) => {
    setCurrentScanResult(result);
    setCurrentScreen('result');
  };

  const handleSelectSample = (sampleImage: string, sampleResult?: ScanResult) => {
    setSelectedDemoImage(sampleImage);
    setSelectedDemoResult(sampleResult || null);
    setCurrentScreen('scan');
  };

  // Helper to quickly load interaction demo pair (Warfarin & Aspirin)
  const handleAddSamplePair = () => {
    const med1: Medicine = {
      id: 'demo-warfarin-' + Date.now(),
      brand_name: 'Coumadin',
      generic_name: 'Warfarin',
      strength: '5mg',
      dose: '1 tablet',
      frequency: 'Once daily at bedtime',
      timing: ['night'],
      with_food: 'unspecified',
      confidence: 'high',
      savedAt: new Date().toISOString(),
    };
    const med2: Medicine = {
      id: 'demo-aspirin-' + (Date.now() + 1),
      brand_name: 'Disprin',
      generic_name: 'Aspirin',
      strength: '75mg',
      dose: '1 tablet',
      frequency: 'Once daily after breakfast',
      timing: ['morning'],
      with_food: 'after',
      confidence: 'high',
      savedAt: new Date().toISOString(),
    };
    saveMedicine(med1);
    const res = saveMedicine(med2);
    setSavedMedicines(res.list);
    if (typeof window !== 'undefined' && (window as any).MedReminders?.addMedicine) {
      try {
        (window as any).MedReminders.addMedicine({
          name: med1.brand_name,
          dose: med1.dose,
          timing: med1.timing,
        });
        (window as any).MedReminders.addMedicine({
          name: med2.brand_name,
          dose: med2.dose,
          timing: med2.timing,
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-teal-200">
      {/* Persistent Accessible Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setSelectedDemoImage(null);
          setCurrentScreen(screen);
        }}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        savedCount={savedMedicines.length}
      />

      {/* Main Screen Container - Centered Mobile First */}
      <main className="flex-1 flex flex-col justify-start">
        {currentScreen === 'home' && (
          <HomeScreen
            language={language}
            onLanguageChange={handleLanguageChange}
            onScanClick={() => {
              setSelectedDemoImage(null);
              setCurrentScreen('scan');
            }}
            onMyMedicinesClick={() => setCurrentScreen('saved')}
            onSelectSample={handleSelectSample}
            savedCount={savedMedicines.length}
          />
        )}

        {currentScreen === 'scan' && (
          <ScanScreen
            language={language}
            onBack={() => {
              setSelectedDemoImage(null);
              setSelectedDemoResult(null);
              setCurrentScreen('home');
            }}
            onScanComplete={handleScanComplete}
            initialImage={selectedDemoImage}
            initialResult={selectedDemoResult}
          />
        )}

        {currentScreen === 'result' && currentScanResult && (
          <ResultScreen
            scanResult={currentScanResult}
            language={language}
            onBack={() => setCurrentScreen('scan')}
            onSaveMedicine={handleSaveMedicine}
            onScanAnother={() => {
              setSelectedDemoImage(null);
              setCurrentScreen('scan');
            }}
            onGoToMyMedicines={() => setCurrentScreen('saved')}
            savedMedicinesList={savedMedicines}
          />
        )}

        {currentScreen === 'saved' && (
          <MyMedicinesScreen
            medicines={savedMedicines}
            language={language}
            onBack={() => setCurrentScreen('home')}
            onScanNew={() => {
              setSelectedDemoImage(null);
              setCurrentScreen('scan');
            }}
            onDeleteMedicine={handleDeleteMedicine}
            onAddSamplePair={handleAddSamplePair}
          />
        )}
      </main>

      {/* Persistent Footer on Every Screen */}
      <Footer language={language} />
    </div>
  );
}
