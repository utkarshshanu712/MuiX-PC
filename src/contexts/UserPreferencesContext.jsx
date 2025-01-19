import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserPreferencesContext = createContext();

export const languages = [
  'Hindi',
  'English',
  'Mix',
  'Punjabi',
  'Bhojpuri',
  'Haryanvi',
  'Rajasthani',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Bengali',
  'Gujarati',
  'Marathi',
  'Odia'
];

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

export const UserPreferencesProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('preferredLanguage');
    return saved || 'Mix';
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    const saved = localStorage.getItem('recentlyPlayed');
    return saved ? JSON.parse(saved) : [];
  });

  const addToRecentlyPlayed = useCallback((song) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      return [song, ...filtered].slice(0, 20);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('preferredLanguage', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  const value = {
    selectedLanguage,
    setSelectedLanguage,
    recentlyPlayed,
    addToRecentlyPlayed,
    languages
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
