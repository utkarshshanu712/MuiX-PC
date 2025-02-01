import React, { createContext, useContext } from 'react';
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
  // Audio Quality Settings
  const [streamingQuality, setStreamingQuality] = useLocalStorage('streamingQuality', '320kbps');
  const [downloadQuality, setDownloadQuality] = useLocalStorage('downloadQuality', '320kbps');

  // Display Settings
  const [showExplicitContent, setShowExplicitContent] = useLocalStorage('showExplicitContent', true);
  const [enableAnimations, setEnableAnimations] = useLocalStorage('enableAnimations', true);
  const [showLyrics, setShowLyrics] = useLocalStorage('showLyrics', true);
  const [autoplayEnabled, setAutoplayEnabled] = useLocalStorage('autoplayEnabled', true);

  // Data Settings
  const [dataSaver, setDataSaver] = useLocalStorage('dataSaver', false);
  const [offlineMode, setOfflineMode] = useLocalStorage('offlineMode', false);
  const [cacheEnabled, setCacheEnabled] = useLocalStorage('cacheEnabled', true);

  // Notification Settings
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage('notificationsEnabled', true);
  const [newMusicNotifications, setNewMusicNotifications] = useLocalStorage('newMusicNotifications', true);
  const [playlistUpdates, setPlaylistUpdates] = useLocalStorage('playlistUpdates', true);

  // Audio Settings
  const [crossfadeEnabled, setCrossfadeEnabled] = useLocalStorage('crossfadeEnabled', false);
  const [crossfadeDuration, setCrossfadeDuration] = useLocalStorage('crossfadeDuration', 5);
  const [normalizeVolume, setNormalizeVolume] = useLocalStorage('normalizeVolume', true);
  const [equalizerEnabled, setEqualizerEnabled] = useLocalStorage('equalizerEnabled', false);

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
    // Audio Quality
    streamingQuality,
    setStreamingQuality,
    downloadQuality,
    setDownloadQuality,
    qualityOptions,
    
    // Display Settings
    showExplicitContent,
    setShowExplicitContent,
    enableAnimations,
    setEnableAnimations,
    showLyrics,
    setShowLyrics,
    autoplayEnabled,
    setAutoplayEnabled,

    // Data Settings
    dataSaver,
    setDataSaver,
    offlineMode,
    setOfflineMode,
    cacheEnabled,
    setCacheEnabled,

    // Notification Settings
    notificationsEnabled,
    setNotificationsEnabled,
    newMusicNotifications,
    setNewMusicNotifications,
    playlistUpdates,
    setPlaylistUpdates,

    // Audio Settings
    crossfadeEnabled,
    setCrossfadeEnabled,
    crossfadeDuration,
    setCrossfadeDuration,
    normalizeVolume,
    setNormalizeVolume,
    equalizerEnabled,
    setEqualizerEnabled,

    getUrlForQuality,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
