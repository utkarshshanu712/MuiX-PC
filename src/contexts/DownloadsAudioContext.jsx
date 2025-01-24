import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useAudio } from './AudioContext';
import { useLocation } from 'react-router-dom';
import { audioStorage } from '../services/AudioStorage';

const DownloadsAudioContext = createContext();

export const DownloadsAudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloadsActive, setIsDownloadsActive] = useState(false);
  const audioRef = useRef(new Audio());
  const { handlePause: pauseMainPlayer, setShowPlayer: setShowMainPlayer } = useAudio();
  const location = useLocation();

  const handlePlay = useCallback(async (track) => {
    try {
      if (!track) return;

      // Pause main player and any other audio
      if (pauseMainPlayer) {
        pauseMainPlayer();
      }
      setIsDownloadsActive(true);
      setShowMainPlayer(false);

      // Set state first to avoid race conditions
      setCurrentTrack(track);

      const audio = audioRef.current;

      // If same track, just resume playback
      if (currentTrack?.id === track.id && audio.src) {
        try {
          await audio.play();
          setIsPlaying(true);
          return;
        } catch (error) {
          console.error('Error resuming track:', error);
          // Continue to reload the track if resume fails
        }
      }

      // Clean up previous audio state
      if (audio.src) {
        const oldSrc = audio.src;
        audio.src = '';
        URL.revokeObjectURL(oldSrc);
      }

      try {
        // Get the audio blob from IndexedDB
        const storedTrack = await audioStorage.getSong(track.id);
        if (!storedTrack || !storedTrack.audioBlob) {
          throw new Error('Track data not found');
        }

        // Create new audio URL and prepare track
        const audioUrl = URL.createObjectURL(storedTrack.audioBlob);
        
        // Set up audio
        audio.src = audioUrl;
        audio.volume = isMuted ? 0 : volume;
        audio.load();

        // Wait for audio to be loaded
        await new Promise((resolve, reject) => {
          const loadHandler = () => {
            audio.removeEventListener('loadeddata', loadHandler);
            audio.removeEventListener('error', errorHandler);
            resolve();
          };
          
          const errorHandler = (error) => {
            audio.removeEventListener('loadeddata', loadHandler);
            audio.removeEventListener('error', errorHandler);
            reject(error);
          };
          
          audio.addEventListener('loadeddata', loadHandler);
          audio.addEventListener('error', errorHandler);
        });

        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing track:', error);
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
          audio.src = '';
        }
        setIsPlaying(false);
        throw error;
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
      setIsPlaying(false);
    }
  }, [currentTrack, isMuted, volume, pauseMainPlayer]);

  const handlePlayAll = useCallback(async (shuffle = false) => {
    try {
      const songs = await audioStorage.getAllSongs();
      if (songs.length === 0) return;

      let tracksToPlay = [...songs];
      if (shuffle) {
        tracksToPlay.sort(() => Math.random() - 0.5);
      }

      const firstTrack = {
        ...tracksToPlay[0].metadata,
        isLocal: true
      };

      await handlePlay(firstTrack);
    } catch (error) {
      console.error('Error in handlePlayAll:', error);
    }
  }, [handlePlay]);

  const handleNext = useCallback(async () => {
    try {
      // Get all songs and find next track
      const songs = await audioStorage.getAllSongs();
      if (songs.length === 0) return;

      const currentIndex = songs.findIndex(song => song.metadata.id === currentTrack?.id);
      let nextIndex = currentIndex + 1;
      if (nextIndex >= songs.length) {
        nextIndex = 0; // Loop back to start
      }

      const nextTrack = {
        ...songs[nextIndex].metadata,
        isLocal: true
      };

      await handlePlay(nextTrack);
    } catch (error) {
      console.error('Error in handleNext:', error);
      setIsPlaying(false);
    }
  }, [currentTrack, handlePlay]);

  const handlePrevious = useCallback(async () => {
    try {
      // Get all songs and find previous track
      const songs = await audioStorage.getAllSongs();
      if (songs.length === 0) return;

      const currentIndex = songs.findIndex(song => song.metadata.id === currentTrack?.id);
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = songs.length - 1; // Loop back to end
      }

      const prevTrack = {
        ...songs[prevIndex].metadata,
        isLocal: true
      };

      await handlePlay(prevTrack);
    } catch (error) {
      console.error('Error in handlePrevious:', error);
      setIsPlaying(false);
    }
  }, [currentTrack, handlePlay]);

  const handleEnded = useCallback(async () => {
    try {
      await handleNext();
    } catch (error) {
      console.error('Error in handleEnded:', error);
      setIsPlaying(false);
    }
  }, [handleNext]);

  const handleSeek = (time) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = value;
      setVolume(value);
      if (value > 0) {
        setIsMuted(false);
      }
    }
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.volume = volume;
        setIsMuted(false);
      } else {
        audio.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleShuffle = useCallback(async () => {
    try {
      // Get all songs from IndexedDB
      const songs = await audioStorage.getAllSongs();
      if (songs.length === 0) return;

      // Create a shuffled copy of songs
      const shuffledSongs = [...songs]
        .sort(() => Math.random() - 0.5);

      // Get first track metadata (audioUrl will be created in handlePlay)
      const firstTrack = {
        ...shuffledSongs[0].metadata,
        isLocal: true
      };

      // Play first track
      await handlePlay(firstTrack);
    } catch (error) {
      console.error('Error in handleShuffle:', error);
      setIsPlaying(false);
    }
  }, [handlePlay]);

  const handlePause = useCallback(async () => {
    try {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error in handlePause:', error);
      setIsPlaying(false);
    }
  }, []);

  // Track when user leaves downloads page
  useEffect(() => {
    const isOnDownloadsPage = location.pathname === '/downloads';
    setIsDownloadsActive(isOnDownloadsPage);
    if (!isOnDownloadsPage) {
      handlePause();
      setShowMainPlayer(true);
    } else {
      setShowMainPlayer(false);
    }
  }, [location.pathname]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleError = (event) => {
      console.error('Audio error:', event);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [handleEnded]);

  // Ensure audio is paused when component unmounts
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    };
  }, []);

  return (
    <DownloadsAudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isDownloadsActive,
        handlePlay,
        handlePause,
        handleNext,
        handlePrevious,
        handleSeek,
        handleVolumeChange,
        handleToggleMute,
        setShowMainPlayer,
        handlePlayAll,
        handleShuffle,
      }}
    >
      {children}
    </DownloadsAudioContext.Provider>
  );
};

export const useDownloadsAudio = () => {
  const context = useContext(DownloadsAudioContext);
  if (!context) {
    throw new Error('useDownloadsAudio must be used within a DownloadsAudioProvider');
  }
  return context;
};
