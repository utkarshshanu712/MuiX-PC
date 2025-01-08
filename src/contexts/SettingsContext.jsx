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
  const [streamingQuality, setStreamingQuality] = useLocalStorage('streamingQuality', '160kbps');
  const [downloadQuality, setDownloadQuality] = useLocalStorage('downloadQuality', '320kbps');

  const qualityOptions = [
    { label: 'Low (12 kbps)', value: '12kbps' },
    { label: 'Normal (48 kbps)', value: '48kbps' },
    { label: 'Medium (96 kbps)', value: '96kbps' },
    { label: 'High (160 kbps)', value: '160kbps' },
    { label: 'Very High (320 kbps)', value: '320kbps' },
  ];

  const getUrlForQuality = (downloadUrls, targetQuality) => {
    if (!Array.isArray(downloadUrls)) {
      return downloadUrls;
    }
    
    // Extract just the number from the quality string
    const targetKbps = parseInt(targetQuality);
    
    // Find the closest quality URL
    const sortedUrls = [...downloadUrls].sort((a, b) => {
      const qualityA = parseInt(a.quality);
      const qualityB = parseInt(b.quality);
      return Math.abs(qualityA - targetKbps) - Math.abs(qualityB - targetKbps);
    });
    
    return sortedUrls[0]?.url || downloadUrls[0]?.url;
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
