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
    
    // Debug log the input
    console.log('Target Quality:', targetQuality);
    console.log('Available Download URLs:', downloadUrls);
    
    // Map quality strings to Saavn's quality codes
    const qualityMap = {
      '96kbps': '96',
      '160kbps': '160',
      '320kbps': '320'
    };
    
    // Get target quality code
    const targetQualityCode = qualityMap[targetQuality] || '320';
    console.log('Target Quality Code:', targetQualityCode);
    
    // Find exact quality match first
    let selectedUrl = downloadUrls.find(url => {
      const urlQuality = url.quality || '';
      return urlQuality.toString() === targetQualityCode;
    });
    
    // If no exact match, find closest higher quality
    if (!selectedUrl) {
      const validUrls = downloadUrls
        .filter(url => url.quality && !isNaN(parseInt(url.quality)))
        .sort((a, b) => parseInt(a.quality) - parseInt(b.quality));
      
      selectedUrl = validUrls.find(url => parseInt(url.quality) >= parseInt(targetQualityCode)) || validUrls[0];
    }
    
    if (selectedUrl) {
      console.log('Selected Quality:', selectedUrl.quality);
      console.log('Selected URL:', selectedUrl.url);
      return selectedUrl.url;
    }
    
    console.warn('No valid quality URLs found, using first available URL');
    return downloadUrls[0]?.url;
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
