import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
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
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const audioRef = useRef(null);
  const { streamingQuality } = useSettings();

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (queueIndex < queue.length - 1) {
        playNext();
      } else {
        setIsPlaying(false);
        setCurrentTrack(null);
      }
    };

    const handleError = (e) => {
      console.error('Audio error:', e.target.error);
      setError('Error playing audio. Please try again.');
      setIsPlaying(false);
    };

    const handleLoadedData = () => {
      setError(null);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.pause();
      audio.src = '';
      audio.load();
    };
  }, [queue.length]);

  const handlePlay = async (song) => {
    try {
      setError(null);
      const audio = audioRef.current;

      if (!audio) {
        throw new Error('Audio player not initialized');
      }

      if (currentTrack?.id === song.id) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Play failed:', error);
            setError('Failed to resume playback');
            setIsPlaying(false);
          }
        }
        return;
      }

      // New song to play
      let playUrl = '';

      if (song.isLocal) {
        if (song.offlineUrl) {
          playUrl = song.offlineUrl;
        } else {
          throw new Error('No valid URL found for local file');
        }
      } else if (song.downloadUrl?.length > 0) {
        const urls = song.downloadUrl;
        const matchingQuality = urls.find(url => url.quality === streamingQuality);
        playUrl = matchingQuality ? matchingQuality.url : urls[0].url;
      }

      if (!playUrl) {
        throw new Error('No playable source found for this song');
      }

      // Stop current playback and reset
      audio.pause();
      audio.src = '';
      audio.load();

      // Set new source and play
      audio.src = playUrl;
      
      try {
        await audio.load();
        await audio.play();
        setCurrentTrack(song);
        setIsPlaying(true);
        setError(null);
      } catch (error) {
        console.error('Playback failed:', error);
        setError('Failed to play the song. Please try again.');
        setIsPlaying(false);
        setCurrentTrack(null);
        audio.src = '';
        audio.load();
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
      setError(error.message || 'Failed to play song');
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const updateQueue = (newQueue, startIndex = 0) => {
    setQueue(newQueue);
    setQueueIndex(startIndex);
  };

  const playNext = async () => {
    if (queueIndex < queue.length - 1) {
      const nextSong = queue[queueIndex + 1];
      setQueueIndex(prev => prev + 1);
      await handlePlay(nextSong);
    } else {
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };

  const value = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    error,
    queue,
    queueIndex,
    handlePlay,
    handleSeek,
    updateQueue,
    playNext
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioProvider;
