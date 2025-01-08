import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from './SettingsContext';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState('');
  const [error, setError] = useState(null);
  const audioRef = useRef(new Audio());
  const { streamingQuality, getUrlForQuality } = useSettings();

  const fetchLyrics = async (songId) => {
    try {
      // Using node-fetch on server side to avoid CORS
      const response = await fetch(`/api/lyrics?id=${songId}`);
      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        setLyrics(data.lyrics);
      } else {
        setLyrics('Lyrics not available');
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      setLyrics('Lyrics not available');
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleTimeUpdate);
      audio.pause();
    };
  }, []);

  const handlePlay = async (song) => {
    try {
      if (currentTrack?.id === song.id) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        const playUrl = getUrlForQuality(song.downloadUrl, streamingQuality);
        
        if (!playUrl) {
          throw new Error('Could not get a valid play URL for song');
        }

        audioRef.current.src = playUrl;
        await audioRef.current.play();
        setCurrentTrack(song);
        setIsPlaying(true);
        fetchLyrics(song.id);
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
      setError('Failed to play song');
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const value = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    lyrics,
    error,
    handlePlay,
    handleSeek,
    audioRef
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
