import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TopPlaylistsContext = createContext();

export const useTopPlaylists = () => useContext(TopPlaylistsContext);

export const TopPlaylistsProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = ['Hindi','English', 'Mix', 'Punjabi','Bhojpuri','Haryanvi','Rajasthani','Coldplay' ,'Diljit dosanjh','Arijit','Honey','Tamil','Telugu', 'Marathi', 'Gujarati', 'Bengali', 'Kannada', 'Malayalam',];

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null)
    setPlaylists([]);

    try {
      // Base query structure based on language
      const baseQuery = selectedLanguage.toLowerCase() === 'English' ? '' : `${selectedLanguage.toLowerCase()} `;

      const queries = [
        // Popular categories
        `${baseQuery}top songs 2024`,
        `${baseQuery}hit songs`,
        `${baseQuery}popular songs`,
        `${baseQuery}trending songs`,
        `${baseQuery}latest songs`,
        
        // Genre based
        `${baseQuery}pop songs`,
        `${baseQuery}rock songs`,
        `${baseQuery}rap songs`,
        `${baseQuery}hip hop songs`,
        `${baseQuery}edm songs`,
        
        // Mood based
        `${baseQuery}romantic songs`,
        `${baseQuery}party songs`,
        `${baseQuery}dance songs`,
        `${baseQuery}chill songs`,
        `${baseQuery}workout songs`,
        `${baseQuery}Sleep songs`,
        `${baseQuery}Sad songs`,
        
        // Era based
        `${baseQuery}2020s songs`,
        `${baseQuery}2010s hits`,
        `${baseQuery}2000s hits`,
        `${baseQuery}90s hits`,
        `${baseQuery}80s hits`,
      ];

      const playlistPromises = queries.map(async (query) => {
        try {
          const response = await axios.get(
            `https://saavn.dev/api/search/playlists?query=${encodeURIComponent(query)}&page=1&limit=10`
          );
          return response.data?.data?.results || [];
        } catch (error) {
          console.error(`Error fetching playlists for query "${query}":`, error);
          return [];
        }
      });

      const results = await Promise.all(playlistPromises);
      const allPlaylists = results.flat();
      
      // Filter out duplicates and ensure minimum song count
      const uniquePlaylists = allPlaylists
        .filter((playlist, index, self) => 
          index === self.findIndex((p) => p.id === playlist.id) && 
          playlist.songCount > 10
        )
        .sort((a, b) => b.songCount - a.songCount);

      setPlaylists(uniquePlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [selectedLanguage]);

  const value = {
    playlists,
    loading,
    error,
    selectedLanguage,
    setSelectedLanguage,
    languages
  };

  return (
    <TopPlaylistsContext.Provider value={value}>
      {children}
    </TopPlaylistsContext.Provider>
  );
};
