import React, { useState } from 'react';
import QuranSurahList from './QuranSurahList';
import QuranReader from './QuranReader';
import { SurahMetadata } from './QuranData';

const SubscriberQuran: React.FC = () => {
  const [selectedSurah, setSelectedSurah] = useState<SurahMetadata | null>(null);

  if (selectedSurah) {
    return (
      <QuranReader 
        surah={selectedSurah} 
        onBack={() => setSelectedSurah(null)} 
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <QuranSurahList onSelectSurah={setSelectedSurah} />
    </div>
  );
};

export default SubscriberQuran;
