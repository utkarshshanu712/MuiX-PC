import React, { createContext, useContext, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [streamingQuality, setStreamingQuality] = useLocalStorage('streamingQuality', '320kbps');
  const [downloadQuality, setDownloadQuality] = useLocalStorage('downloadQuality', '320kbps');

  const qualityOptions = [
    { label: 'Normal (96 kbps)', value: '96kbps' },
    { label: 'Medium (160 kbps)', value: '160kbps' },
    { label: 'High (320 kbps)', value: '320kbps' },
  ];

  const getUrlForQuality = (downloadUrls, targetQuality) => {
    if (!Array.isArray(downloadUrls)) {
      return downloadUrls;
    }
    
    // Map quality strings to Saavn's quality codes
    const qualityMap = {
      '96kbps': '96kbps',
      '160kbps': '160kbps',
      '320kbps': '320kbps'
    };
    
    // Get target quality
    const targetQualityString = qualityMap[targetQuality] || '320kbps';
    
    // Find exact quality match
    let selectedUrl = downloadUrls.find(url => url.quality === targetQualityString);
    
    // If no exact match, find closest higher quality
    if (!selectedUrl) {
      const availableQualities = downloadUrls
        .map(url => parseInt(url.quality))
        .filter(q => !isNaN(q))
        .sort((a, b) => a - b);
      
      const targetQualityNum = parseInt(targetQualityString);
      const higherQuality = availableQualities.find(q => q >= targetQualityNum);
      
      if (higherQuality) {
        selectedUrl = downloadUrls.find(url => 
          parseInt(url.quality) === higherQuality
        );
      }
    }
    
    // If still no match, use the highest available quality
    if (!selectedUrl && downloadUrls.length > 0) {
      selectedUrl = downloadUrls.reduce((prev, curr) => {
        const prevQuality = parseInt(prev.quality);
        const currQuality = parseInt(curr.quality);
        return currQuality > prevQuality ? curr : prev;
      });
    }

    return selectedUrl;
  };

  const value = {
    streamingQuality,
    setStreamingQuality,
    downloadQuality,
    setDownloadQuality,
    qualityOptions,
    getUrlForQuality,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
