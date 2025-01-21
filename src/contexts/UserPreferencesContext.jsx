import React, { createContext, useContext, useState, useEffect } from 'react';

const UserPreferencesContext = createContext();

export const languages = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'mix', label: 'Mix' },
  { value: 'bhojpuri', label: 'Bhojpuri' },
  { value: 'haryanvi', label: 'Haryanvi' },
  { value: 'rajasthani', label: 'Rajasthani' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'odia', label: 'Odia' }
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
    return localStorage.getItem('preferredLanguage') || 'english';
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const saved = localStorage.getItem('recentlyPlayed');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading recently played:', error);
      localStorage.removeItem('recentlyPlayed');
      return [];
    }
  });

  const addToRecentlyPlayed = (song) => {
    if (!song?.id) return;
    
    try {
      setRecentlyPlayed(prevSongs => {
        // Remove the song if it already exists
        const filteredSongs = prevSongs.filter(s => s.id !== song.id);
        // Add the song to the beginning and limit to 20 songs
        const newSongs = [song, ...filteredSongs].slice(0, 20);
        // Update localStorage
        localStorage.setItem('recentlyPlayed', JSON.stringify(newSongs));
        return newSongs;
      });
    } catch (error) {
      console.error('Error adding song to recently played:', error);
    }
  };

  const clearRecentlyPlayed = () => {
    try {
      setRecentlyPlayed([]);
      localStorage.removeItem('recentlyPlayed');
    } catch (error) {
      console.error('Error clearing recently played:', error);
    }
  };

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
    clearRecentlyPlayed,
    languages
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
