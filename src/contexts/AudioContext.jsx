import React, { createContext, useContext, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from './SettingsContext';
import { useSnackbar } from './SnackbarContext';

export const AudioContext = createContext();

// Advanced audio source validation
const validateAudioSource = async (url, timeout = 5000) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Invalid URL' };
  }

  return new Promise((resolve) => {
    const audio = new Audio();
    let timeoutId;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      audio.removeEventListener('canplaythrough', successHandler);
      audio.removeEventListener('error', errorHandler);
      audio.src = '';
    };

    const successHandler = () => {
      cleanup();
      resolve({ valid: true, url });
    };

    const errorHandler = (e) => {
      cleanup();
      resolve({ 
        valid: false, 
        error: e.message || 'Unknown audio source error',
        url 
      });
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve({ valid: false, error: 'Audio source validation timed out', url });
    }, timeout);

    audio.addEventListener('canplaythrough', successHandler);
    audio.addEventListener('error', errorHandler);

    try {
      audio.src = url;
    } catch (err) {
      cleanup();
      resolve({ valid: false, error: err.message, url });
    }
  });
};

// Detect MIME type from URL
const detectMimeType = (url) => {
  const extension = url.split('.').pop().toLowerCase();
  const mimeTypeMap = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'ogg': 'audio/ogg',
    'webm': 'audio/webm'
  };
  return mimeTypeMap[extension] || 'audio/mpeg';
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const { streamingQuality } = useSettings();
  const { enqueueSnackbar } = useSnackbar();

  // State management
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLooped, setIsLooped] = useState(false);
  const [showPlayer, setShowPlayer] = useState(true);

  // Refs
  const audioRef = useRef(null);
  const preloadAudioRef = useRef(null);

  // Enhanced URL selection with comprehensive validation
  const getBestAudioUrl = useCallback(async (song) => {
    if (!song) return null;

    // Local file priority
    if (song.isLocal && song.audioUrl) {
      const localValidation = await validateAudioSource(song.audioUrl);
      if (localValidation.valid) return song.audioUrl;
    }

    // Download URL fallback
    if (song.downloadUrl?.length > 0) {
      const urls = song.downloadUrl;
      const qualityPriority = [
        streamingQuality, 
        'high', 
        'medium', 
        'low'
      ];

      for (const quality of qualityPriority) {
        const matchingUrls = urls.filter(u => u.quality === quality);
        
        for (const urlObj of matchingUrls) {
          const validation = await validateAudioSource(urlObj.url);
          if (validation.valid) {
            console.log(`Found valid URL for quality ${quality}:`, urlObj.url);
            return urlObj.url;
          }
        }
      }
    }

    // Fallback to first URL if available
    if (song.downloadUrl?.[0]?.url) {
      return song.downloadUrl[0].url;
    }

    return null;
  }, [streamingQuality]);

  // Robust play handler
  const handlePlay = useCallback(async (song) => {
    try {
      const audio = audioRef.current;
      if (!audio) throw new Error('Audio player not initialized');

      // Handle play/pause for current track
      if (currentTrack?.id === song.id) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (error) {
            enqueueSnackbar('Failed to resume playback', { variant: 'error' });
            setIsPlaying(false);
          }
        }
        return;
      }

      // Get validated playback URL
      const playUrl = await getBestAudioUrl(song);

      if (!playUrl) {
        enqueueSnackbar('No playable URL found for this song', { variant: 'error' });
        return;
      }

      // Detect MIME type and set explicitly
      const mimeType = detectMimeType(playUrl);
      
      // Stop current playback
      audio.pause();
      
      // Load and play new track
      audio.src = playUrl;
      audio.type = mimeType;
      
      try {
        await audio.play();
        setCurrentTrack(song);
        setIsPlaying(true);

        // Preload next track if in queue
        if (queue.length > 0) {
          const preloadUrl = await getBestAudioUrl(queue[0]);
          if (preloadUrl && preloadAudioRef.current) {
            preloadAudioRef.current.src = preloadUrl;
            preloadAudioRef.current.preload = 'auto';
          }
        }
      } catch (error) {
        console.error('Play failed:', error);
        enqueueSnackbar(`Failed to play audio: ${error.message}`, { variant: 'error' });
        setIsPlaying(false);
      }

    } catch (error) {
      console.error('Play error:', error);
      enqueueSnackbar(`An error occurred while playing: ${error.message}`, { variant: 'error' });
      setIsPlaying(false);
    }
  }, [currentTrack, isPlaying, queue, getBestAudioUrl, enqueueSnackbar]);

  // Next and Previous track handlers
  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue;
      setQueue(remainingQueue);
      handlePlay(nextTrack);
    }
  }, [queue, handlePlay]);

  const handlePrevious = useCallback(() => {
    if (queueIndex > 0) {
      const previousTrack = queue[queueIndex - 1];
      setQueue([previousTrack, ...queue]);
      setQueueIndex(queueIndex - 1);
      handlePlay(previousTrack);
    }
  }, [queueIndex, queue, handlePlay]);

  // Audio event listeners setup
  useEffect(() => {
    const audio = audioRef.current = new Audio();
    const preloadAudio = preloadAudioRef.current = new Audio();
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      handleNext();
    };

    const handleError = (e) => {
      console.error('Audio playback error:', {
        type: e.type,
        target: e.target.src,
        error: e.error
      });
      
      enqueueSnackbar('Unable to play audio. Trying next track.', { 
        variant: 'warning',
        autoHideDuration: 3000
      });

      // Attempt to play next track on error
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [handleNext, enqueueSnackbar]);

  // Memoized context value
  const value = useMemo(() => ({
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    queue,
    queueIndex,
    volume,
    isMuted,
    isShuffled,
    isLooped,
    showPlayer,
    setShowPlayer,
    handlePlay,
    handlePause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    },
    handleNext,
    handlePrevious,
    handleSeek: (time) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    handleVolumeChange: (newVolume) => {
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    },
    handleToggleMute: () => {
      setIsMuted(!isMuted);
      if (audioRef.current) {
        audioRef.current.muted = !isMuted;
      }
    },
    handleToggleShuffle: () => setIsShuffled(!isShuffled),
    handleToggleLoop: () => setIsLooped(!isLooped),
  }), [
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    queue, 
    queueIndex, 
    volume, 
    isMuted, 
    isShuffled, 
    isLooped, 
    showPlayer,
    handlePlay,
    handleNext,
    handlePrevious,
    isMuted
  ]);

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} />
      <audio ref={preloadAudioRef} />
    </AudioContext.Provider>
  );
};

export default AudioProvider;
