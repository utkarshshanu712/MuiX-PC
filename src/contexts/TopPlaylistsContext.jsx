import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TopPlaylistsContext = createContext();

export const useTopPlaylists = () => useContext(TopPlaylistsContext);

export const TopPlaylistsProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  const languages = [
    // Categories
    'All','हिन्दी', 'Mix', 'Punjabi', 'Bhojpuri', 'Haryanvi', 'Rajasthani',
    // Regional Languages
    'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Bengali', 'Kannada', 'Malayalam',
    // Artists - Punjabi
    'Diljit Dosanjh', 'AP Dhillon', 'Sidhu Moosewala', 'Honey ', 'Guru Randhawa', 'Karan Aujla',
    // Artists - Hindi
    'Arijit ', 'Neha Kakkar', 'Badshah', 'Jubin Nautiyal', 'B Praak', 'Atif Aslam',
    'KK', 'Shreya Ghoshal', 'Sonu Nigam', 'Kumar Sanu', 'Armaan Malik', 'Vishal-Shekhar',
    'Pritam', 'AR Rahman', 'Amit Trivedi', 'Mohit Chauhan', 'Manoj Muntashir',
    // Artists - Bhojpuri
    'Manoj Tiwari', 'Pawan Singh', 'Khesari Lal Yadav', 'Nirahua', 'Amrapali Dubey', 'Akshara Singh',
    'Ritesh Pandey', 'Pradeep Pandey', 'Vinay Bihari', 'Bhojpuri Shakti', 'Anupama Yadav',
  ];

  // Helper function to check if selected option is an artist
  const isArtist = (selected) => {
    const artists = [
      // Punjabi Artists
      'Diljit Dosanjh', 'AP Dhillon', 'Sidhu Moosewala', 'Honey Singh', 'Guru Randhawa', 'Karan Aujla',
      // Hindi Artists
      'Arijit Singh', 'Neha Kakkar', 'Badshah', 'Jubin Nautiyal', 'B Praak', 'Atif Aslam',
      'KK', 'Shreya Ghoshal', 'Sonu Nigam', 'Kumar Sanu', 'Armaan Malik', 'Vishal-Shekhar',
      'Pritam', 'AR Rahman', 'Amit Trivedi', 'Mohit Chauhan',   'Manoj Muntashir',
      // Bhojpuri Artists
      'Manoj Tiwari', 'Pawan Singh', 'Khesari Lal Yadav', 'Nirahua', 'Amrapali Dubey', 'Akshara Singh',
      'Ritesh Pandey', 'Pradeep Pandey', 'Vinay Bihari', 'Bhojpuri Shakti', 'Anupama Yadav',
    ];
    return artists.includes(selected);
  };

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);
    setPlaylists([]);

    try {
      let queries = [];
      
      if (isArtist(selectedLanguage)) {
        queries = [
          `${selectedLanguage} hits`,
          `${selectedLanguage} popular songs`,
          `${selectedLanguage} greatest hits`,
          `${selectedLanguage} all songs`,
          `${selectedLanguage} top songs`,
          `${selectedLanguage} best songs`,
          `${selectedLanguage} playlist`,
          `best of ${selectedLanguage}`,
          `${selectedLanguage} collection`,
          `${selectedLanguage} album`,
          `${selectedLanguage} live`,
          `${selectedLanguage} acoustic`,
          `${selectedLanguage} essentials`,
          `${selectedLanguage} classics`,
          `${selectedLanguage} latest`
        ];
      } else {
        // Base query structure based on language
        const baseQuery = selectedLanguage.toLowerCase() === 'hindi' ? '' : `${selectedLanguage.toLowerCase()} `;
        
        queries = [
          // Popular categories
          `${baseQuery}top songs 2024`,
          `${baseQuery}hit songs`,
          `${baseQuery}popular songs`,
          `${baseQuery}trending songs`,
          `${baseQuery}latest songs`,
          
          // Genre based
          `${baseQuery}pop songs`,
          `${baseQuery}romantic hits`,
          `${baseQuery}dance hits`,
          `${baseQuery}party hits`,
          `${baseQuery}folk songs`,
          
          // Mood based
          `${baseQuery}romantic songs`,
          `${baseQuery}party songs`,
          `${baseQuery}dance songs`,
          `${baseQuery}chill songs`,
          `${baseQuery}workout songs`,
          `${baseQuery}sad songs`,
          
          // Era based
          `${baseQuery}2024 hits`,
          `${baseQuery}new songs`,
         
          `${baseQuery}classic hits`
        ];
      }

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