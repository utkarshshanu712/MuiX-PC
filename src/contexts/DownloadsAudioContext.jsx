import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useAudio } from './AudioContext';
import { useLocation } from 'react-router-dom';

const DownloadsAudioContext = createContext();

export const DownloadsAudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showOnlinePlayer, setShowOnlinePlayer] = useState(false);
  const [isDownloadsActive, setIsDownloadsActive] = useState(false);
  const audioRef = useRef(new Audio());
  const { handlePause: pauseMainPlayer } = useAudio();
  const location = useLocation();

  // Track when user leaves downloads page
  useEffect(() => {
    const isOnDownloadsPage = location.pathname === '/downloads';
    if (!isOnDownloadsPage && isDownloadsActive) {
      // Stop downloads player when leaving downloads page
      handlePause();
      setIsDownloadsActive(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (queue.length > 0) {
        const nextTrack = queue[0];
        const remainingQueue = queue.slice(1);
        setQueue(remainingQueue);
        handlePlay(nextTrack, remainingQueue);
      } else {
        setIsPlaying(false);
        setIsDownloadsActive(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue]);

  const handlePlay = async (track, playlist = []) => {
    try {
      // Pause the main player and set downloads as active
      if (pauseMainPlayer) {
        pauseMainPlayer();
      }
      setIsDownloadsActive(true);
      setShowOnlinePlayer(false);

      const audio = audioRef.current;

      if (currentTrack?.id === track.id) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          await audio.play();
          setIsPlaying(true);
        }
        return;
      }

      // Set current track and queue
      setCurrentTrack(track);
      setQueue(playlist.filter(item => item.id !== track.id));

      // Load and play new track
      audio.src = track.audioUrl;
      audio.load();
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Play error:', error);
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const remainingQueue = queue.slice(1);
      setQueue(remainingQueue);
      handlePlay(nextTrack, remainingQueue);
    }
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      handleSeek(0);
    } else if (queue.length > 0) {
      const previousTrack = queue[queue.length - 1];
      const remainingQueue = queue.slice(0, -1);
      setQueue(remainingQueue);
      handlePlay(previousTrack, remainingQueue);
    }
  };

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

  return (
    <DownloadsAudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        showOnlinePlayer,
        isDownloadsActive,
        handlePlay,
        handlePause,
        handleNext,
        handlePrevious,
        handleSeek,
        handleVolumeChange,
        handleToggleMute,
        setShowOnlinePlayer,
        setIsDownloadsActive,
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
