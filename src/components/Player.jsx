import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Drawer,
  Menu,
  MenuItem,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Tooltip,
  CircularProgress
} from "@mui/material";
import {
  Pause,
  PlayArrow,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeOff,
  VolumeMute,
  QueueMusic,
  Timer,
  Favorite,
  FavoriteBorder,
  Lyrics,
  Download,
  ExpandLess,
  ExpandMore,
  PlaylistAdd,
  Close,
  PlaylistPlay,
  Shuffle
} from "@mui/icons-material";
import ExpandedPlayer from "./ExpandedPlayer";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLibrary } from "../contexts/LibraryContext";
import { useSettings } from '../contexts/SettingsContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import PlaylistMenu from "./PlaylistMenu";
import { audioStorage } from '../services/AudioStorage';

// Function to create ID3v2 tag buffer
const createID3v2Buffer = (metadata, imageBuffer) => {
  try {
    // Helper function to encode text as Latin1
    const encodeLatin1 = (text) => {
      const cleaned = text.replace(/[^\x20-\xFF]/g, '_');
      return new Uint8Array(cleaned.split('').map(char => char.charCodeAt(0) & 0xFF));
    };

    // Calculate total size for all text frames
    let totalSize = 10; // ID3v2 header size
    const frames = [];
    
    // Process metadata
    Object.entries(metadata).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        const frameId = getFrameId(key);
        if (frameId) {
          const encodedText = encodeLatin1(value);
          const frameSize = encodedText.length + 1; // +1 for encoding byte
          frames.push({
            id: frameId,
            data: encodedText,
            size: frameSize
          });
          totalSize += frameSize + 10; // 10 bytes for frame header
        }
      }
    });

    // Add size for image frame if present
    let imageFrameSize = 0;
    if (imageBuffer && imageBuffer.byteLength > 0) {
      imageFrameSize = 10 + 1 + 10 + 1 + 1 + imageBuffer.byteLength;
      totalSize += imageFrameSize;
    }

    // Create buffer
    const buffer = new ArrayBuffer(totalSize);
    const view = new Uint8Array(buffer);
    
    // Write ID3v2 header
    view.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]); // ID3v2.3.0 header
    
    // Write total size (not synchsafe)
    const size = totalSize - 10;
    view[6] = (size >> 24) & 0xFF;
    view[7] = (size >> 16) & 0xFF;
    view[8] = (size >> 8) & 0xFF;
    view[9] = size & 0xFF;

    let offset = 10;

    // Write text frames
    frames.forEach(frame => {
      // Frame ID
      view.set(new TextEncoder().encode(frame.id), offset);
      offset += 4;
      
      // Frame size
      view[offset++] = (frame.size >> 24) & 0xFF;
      view[offset++] = (frame.size >> 16) & 0xFF;
      view[offset++] = (frame.size >> 8) & 0xFF;
      view[offset++] = frame.size & 0xFF;
      
      // Frame flags (all 0)
      view[offset++] = 0x00;
      view[offset++] = 0x00;
      
      // Text encoding (ISO-8859-1)
      view[offset++] = 0x00;
      
      // Frame data
      view.set(frame.data, offset);
      offset += frame.data.length;
    });

    // Write image frame if present
    if (imageBuffer && imageBuffer.byteLength > 0) {
      // APIC frame header
      view.set(new TextEncoder().encode('APIC'), offset);
      offset += 4;
      
      // Frame size
      const pictureFrameSize = imageFrameSize - 10;
      view[offset++] = (pictureFrameSize >> 24) & 0xFF;
      view[offset++] = (pictureFrameSize >> 16) & 0xFF;
      view[offset++] = (pictureFrameSize >> 8) & 0xFF;
      view[offset++] = pictureFrameSize & 0xFF;
      
      // Frame flags
      view[offset++] = 0x00;
      view[offset++] = 0x00;
      
      // Picture frame content
      view[offset++] = 0x00; // encoding
      view.set(new TextEncoder().encode('image/jpeg\0'), offset);
      offset += 10;
      view[offset++] = 0x03; // picture type - cover
      view[offset++] = 0x00; // no description
      
      // Image data
      view.set(new Uint8Array(imageBuffer), offset);
    }

    return view;
  } catch (error) {
    console.error('Error creating ID3v2 buffer:', error);
    throw new Error('Failed to create ID3 tags: ' + error.message);
  }
};

const getFrameId = (key) => {
  const frameMap = {
    title: 'TIT2',
    artist: 'TPE1',
    album: 'TALB',
    year: 'TYER',
    genre: 'TCON',
    publisher: 'TPUB',
    copyright: 'TCOP',
    encodedBy: 'TENC',
    comments: 'COMM',
    quality: 'TMED'
  };
  return frameMap[key];
};

const createID3v1Buffer = (metadata) => {
  try {
    const buffer = new ArrayBuffer(128);
    const view = new Uint8Array(buffer);
    
    // ID3v1 header - "TAG"
    view[0] = 0x54; // T
    view[1] = 0x41; // A
    view[2] = 0x47; // G
    
    const writeField = (text, start, length) => {
      const cleaned = (text || '')
        .replace(/[^\x20-\x7E]/g, '_')
        .padEnd(length, ' ')
        .slice(0, length);
      
      for (let i = 0; i < length; i++) {
        view[start + i] = cleaned.charCodeAt(i);
      }
    };
    
    // Write fields
    writeField(metadata.title, 3, 30);     // Title - 30 chars
    writeField(metadata.artist, 33, 30);    // Artist - 30 chars
    writeField(metadata.album, 63, 30);     // Album - 30 chars
    writeField(metadata.year, 93, 4);       // Year - 4 chars
    writeField(metadata.comments, 97, 30);   // Comment - 30 chars
    view[127] = 255;                        // Genre - 255 = Unknown
    
    return view;
  } catch (error) {
    console.error('Error creating ID3v1 buffer:', error);
    return null;
  }
};

// Utility function for URL validation
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

// MIME type detection
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

// Enhanced URL selection
const getUrlForQuality = (downloadUrls, preferredQuality = 'high') => {
  if (!downloadUrls || !Array.isArray(downloadUrls)) return null;

  const qualityPriority = [
    preferredQuality, 
    'high', 
    'medium', 
    'low'
  ];

  for (const quality of qualityPriority) {
    const matchingUrls = downloadUrls.filter(u => u.quality === quality);
    
    for (const urlObj of matchingUrls) {
      return urlObj.url;
    }
  }

  // Fallback to first URL if no quality match
  return downloadUrls[0]?.url || null;
};

const Player = ({
  currentTrack = null,
  onNext = () => {},
  onPrevious = () => {},
  hasNext = false,
  hasPrevious = false,
  queue = [],
  onQueueItemClick = () => {},
  onLyricsClick = () => {},
}) => {
  // State hooks
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [error, setError] = useState(null);
  const [playHistory, setPlayHistory] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [playlistAnchorEl, setPlaylistAnchorEl] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [timerAnchorEl, setTimerAnchorEl] = useState(null);
  const [timerDuration, setTimerDuration] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isContinuousPlay, setIsContinuousPlay] = useState(false);

  // Refs
  const audioRef = useRef(new Audio());

  // Context hooks
  const { enqueueSnackbar } = useSnackbar();
  const { addToRecentlyPlayed } = useUserPreferences();
  const { downloadQuality } = useUserPreferences();
  const { streamingQuality, getUrlForQuality } = useSettings();

  // Callback hooks
  const handleLikeClick = useCallback(() => {
    if (!currentTrack) return;

    const likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
    const trackIndex = likedSongs.findIndex(song => song.id === currentTrack.id);

    if (trackIndex === -1) {
      // Add to liked songs
      likedSongs.push({
        id: currentTrack.id,
        title: currentTrack.title || currentTrack.name,
        artist: currentTrack.artist || currentTrack.primaryArtists,
        image: currentTrack.image?.[0]?.link || currentTrack.coverUrl,
        addedAt: new Date().toISOString()
      });
      setIsLiked(true);
      enqueueSnackbar('Added to Liked Songs', { variant: 'success' });
    } else {
      // Remove from liked songs
      likedSongs.splice(trackIndex, 1);
      setIsLiked(false);
      enqueueSnackbar('Removed from Liked Songs', { variant: 'info' });
    }

    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [currentTrack, enqueueSnackbar]);

  const handlePlayPause = useCallback(async () => {
    if (playbackError) return;

    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
      setPlaybackError(null);
    } catch (error) {
      console.error('Playback error:', error);
      setPlaybackError(error.message);
      setIsPlaying(false);
    }
  }, [isPlaying, playbackError]);

  const loadAndPlayTrack = useCallback(async () => {
    if (!currentTrack) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const audio = audioRef.current;

      let audioUrl = null;
      
      if (currentTrack.isLocal && currentTrack.audioUrl) {
        audioUrl = currentTrack.audioUrl;
      } 
      else if (currentTrack.downloadUrl && Array.isArray(currentTrack.downloadUrl)) {
        const selectedQuality = getUrlForQuality(currentTrack.downloadUrl, streamingQuality);
        if (selectedQuality) {
          audioUrl = selectedQuality.url;
        }
      }
      else if (currentTrack.downloadUrl && typeof currentTrack.downloadUrl === 'string') {
        audioUrl = currentTrack.downloadUrl;
      }
      else if (currentTrack.url) {
        audioUrl = currentTrack.url;
      }

      if (!audioUrl) {
        throw new Error('No playable audio URL found');
      }

      audio.src = audioUrl;
      await audio.load();
      
      if (isPlaying) {
        await audio.play();
        // Add to recently played when playback starts successfully
        if (currentTrack && currentTrack.id) {
          addToRecentlyPlayed({
            ...currentTrack,
            timestamp: new Date().getTime()
          });
        }
      }
      
      setPlaybackError(null);
    } catch (error) {
      console.error('Error loading track:', error);
      setPlaybackError(error.message);
      setError('Failed to load audio');
      enqueueSnackbar('Failed to load audio', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [currentTrack, isPlaying, streamingQuality, getUrlForQuality, enqueueSnackbar, addToRecentlyPlayed]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.currentTime)) {
      requestAnimationFrame(() => {
        setCurrentTime(audio.currentTime);
        if (!isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      });
    }
  }, []);

  const handleNext = useCallback(() => {
    if (onNext) {
      setPlayHistory(prev => {
        const newHistory = prev.filter(track => track.id !== currentTrack.id);
        return [currentTrack, ...newHistory].slice(0, 50); // Keep last 50 tracks
      });
      onNext();
    }
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    if (audioRef.current.currentTime > 3) {
      // If current time > 3 seconds, restart the song
      audioRef.current.currentTime = 0;
    } else if (playHistory.length > 1) {
      // Play previous song from history
      const previousTrack = playHistory[1]; // Current track is at index 0
      onPrevious(previousTrack);
    } else {
      // Just restart the song if no history
      audioRef.current.currentTime = 0;
    }
  }, [playHistory, onPrevious]);

  const handleSliderChange = useCallback((_, newValue) => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      const newTime = (newValue / 100) * audio.duration;
      if (!isNaN(newTime) && isFinite(newTime) && newTime >= 0 && newTime <= audio.duration) {
        setCurrentTime(newTime); // Update UI immediately
        audio.currentTime = newTime;
      }
    }
  }, []);

  const handleSliderChangeCommitted = useCallback((_, newValue) => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      const newTime = (newValue / 100) * audio.duration;
      if (!isNaN(newTime) && isFinite(newTime) && newTime >= 0 && newTime <= audio.duration) {
        audio.currentTime = newTime;
      }
    }
  }, []);

  const handleQueueClick = useCallback(() => {
    setShowQueue(prev => !prev);
  }, []);

  const handleCloseQueue = useCallback(() => {
    setShowQueue(false);
  }, []);

  const handleExpandedClose = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleQueueItemClick = useCallback((song, index) => {
    setPlayHistory(prev => {
      const newHistory = prev.filter(track => track.id !== song.id);
      return [song, ...newHistory].slice(0, 50); // Keep last 50 tracks
    });
    onQueueItemClick(song, index);
    handleCloseQueue();
  }, [onQueueItemClick, handleCloseQueue]);

  const handleVolumeChange = useCallback((event, newValue) => {
    if (audioRef.current) {
      audioRef.current.volume = newValue;
      setVolume(newValue);
      if (newValue === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const handleToggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const formatTime = useCallback((time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const formatTimerDisplay = useCallback((seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const handleTimerClick = useCallback((event) => {
    setTimerAnchorEl(event.currentTarget);
  }, []);

  const handleTimerClose = useCallback(() => {
    setTimerAnchorEl(null);
  }, []);

  const handleTimerSet = useCallback((duration) => {
    setTimerDuration(duration);
    setTimerRemaining(duration * 60); // Convert minutes to seconds
    handleTimerClose();

    // Clear existing timer if any
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }

    // Start new timer
    const intervalId = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setTimerIntervalId(null);
          setTimerDuration(null);
          setIsPlaying(false);
          audioRef.current.pause();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerIntervalId(intervalId);
  }, [timerIntervalId]);

  const handleTimerCancel = useCallback(() => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }
    setTimerDuration(null);
    setTimerRemaining(null);
    handleTimerClose();
  }, [timerIntervalId]);

  const formatTimerTime = useCallback((seconds) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours > 0 ? hours + ":" : ""}${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const volumeControls = useMemo(
    () => (
      <>
        <IconButton
          onClick={handleToggleMute}
          sx={{ color: "white" }}
        >
          {isMuted ? (
            <VolumeOff />
          ) : volume === 0 ? (
            <VolumeMute />
          ) : (
            <VolumeUp />
          )}
        </IconButton>
        <Slider
          size="small"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          min={0}
          max={1}
          step={0.01}
          aria-label="Volume"
          sx={{
            width: 100,
            color: "#1db954",
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0px 0px 0px 8px rgba(29, 185, 84, 0.16)',
              },
            },
          }}
        />
      </>
    ),
    [volume, isMuted, handleToggleMute, handleVolumeChange]
  );

  const playerControls = useMemo(
    () => (
      <Box
        sx={{
          width: { xs: "45%", sm: "40%" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1
        }}
      >
        {/* Playback Controls */}
        <Box sx={{ 
          display: "flex", 
          alignItems: "center",
          gap: { xs: 0.5, sm: 1 }
        }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            disabled={!hasPrevious}
            sx={{ 
              color: "white",
              padding: { xs: "4px", sm: "8px" }
            }}
          >
            <SkipPrevious sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }} />
          </IconButton>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            sx={{ 
              color: "white",
              padding: { xs: "4px", sm: "8px" }
            }}
          >
            {isPlaying ? (
              <Pause sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem" } }} />
            ) : (
              <PlayArrow sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem" } }} />
            )}
          </IconButton>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            disabled={!hasNext}
            sx={{ 
              color: "white",
              padding: { xs: "4px", sm: "8px" }
            }}
          >
            <SkipNext sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }} />
          </IconButton>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ 
          width: "100%", 
          display: "flex", 
          alignItems: "center",
          gap: 1,
          px: { xs: 1, sm: 2 }
        }}>
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          <Slider
            size="small"
            value={((currentTime / duration) * 100) || 0}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            sx={{
              color: "#1db954",
              height: 4,
              "& .MuiSlider-thumb": {
                width: 8,
                height: 8,
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: "0px 0px 0px 8px rgba(29, 185, 84, 0.16)",
                },
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>
    ),
    [isPlaying, hasNext, hasPrevious, currentTime, duration, playbackError]
  );

  const trackControls = useMemo(
    () => (
      <Box
        sx={{
          width: { xs: "20%", sm: "30%" },
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: { xs: 0.5, sm: 1 }
        }}
      >
        {/* Timer Button */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleTimerClick();
          }}
          sx={{ 
            color: "white",
            padding: { xs: "4px", sm: "8px" },
            display: { xs: "none", sm: "flex" }
          }}
        >
          <Timer sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
        </IconButton>

        {/* Volume Controls - Only show on larger screens */}
        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
          {volumeControls}
        </Box>

        {/* Queue Button */}
        <IconButton 
          sx={{ 
            color: "white",
            padding: { xs: "4px", sm: "8px" }
          }} 
          onClick={(e) => {
            e.stopPropagation();
            handleQueueClick(e);
          }}
        >
          <QueueMusic sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
        </IconButton>
      </Box>
    ),
    [timerDuration, timerRemaining]
  );

  // Memoized Queue Item Component
  const QueueItem = memo(({ song, index, onQueueItemClick }) => (
    <Box
      onClick={() => onQueueItemClick(song, index)}
      sx={{
        display: "flex",
        alignItems: "center",
        p: 1,
        borderRadius: 1,
        mb: 1,
        cursor: "pointer",
        "&:hover": {
          bgcolor: "#383838",
          transform: "scale(1.02)",
          transition: "all 0.2s ease",
        },
      }}
    >
      <img
        src={song.image?.[0]?.url || song.image?.[1]?.url}
        alt={song.name}
        style={{ width: 40, height: 40, borderRadius: 4, marginRight: 12 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="white" noWrap>
          {song.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {song.primaryArtists || song.artists?.primary?.[0]?.name}
        </Typography>
      </Box>
    </Box>
  ));

  // Memoized Queue List Component
  const QueueList = memo(({ queue, onQueueItemClick }) => (
    <Box
      sx={{
        overflowY: "auto",
        maxHeight: "calc(100vh - 100px)",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          background: "#282828",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "#535353",
          borderRadius: "4px",
        },
      }}
    >
      {queue.map((song, index) => (
        <QueueItem
          key={song.id || index}
          song={song}
          index={index}
          onQueueItemClick={onQueueItemClick}
        />
      ))}
    </Box>
  ));

  // Memoized Queue Drawer Component
  const QueueDrawer = memo(({ open, onClose, queue, onQueueItemClick }) => (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1300,
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
      PaperProps={{
        sx: {
          width: 350,
          bgcolor: "#282828",
          p: 2,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" color="white">
          Play Queue
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <Close />
        </IconButton>
      </Box>

      {queue && queue.length > 0 ? (
        <QueueList queue={queue} onQueueItemClick={onQueueItemClick} />
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          Queue is empty
        </Typography>
      )}
    </Drawer>
  ));

  // Add PropTypes
  QueueItem.propTypes = {
    song: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onQueueItemClick: PropTypes.func.isRequired,
  };

  QueueList.propTypes = {
    queue: PropTypes.array.isRequired,
    onQueueItemClick: PropTypes.func.isRequired,
  };

  QueueDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    queue: PropTypes.array.isRequired,
    onQueueItemClick: PropTypes.func.isRequired,
  };

  const getDisplayInfo = useCallback(() => {
    if (!currentTrack) return null;

    // For downloaded/offline tracks
    if (currentTrack.isLocal) {
      return {
        title: currentTrack.title || currentTrack.name,
        artist: currentTrack.artist || currentTrack.primaryArtists,
        image: currentTrack.image?.[0]?.link || currentTrack.coverUrl,
        isOffline: true
      };
    }

    // For online tracks - get highest quality image available
    const highQualityImage = currentTrack.image?.find(img => img.quality === '500x500')?.url ||
                            currentTrack.image?.find(img => img.quality === '150x150')?.url ||
                            currentTrack.image?.find(img => img.quality === '50x50')?.url;

    return {
      title: currentTrack.name || currentTrack.title,
      artist: currentTrack.primaryArtists || currentTrack.artist || currentTrack.artists?.primary?.[0]?.name,
      image: highQualityImage,
      isOffline: false
    };
  }, [currentTrack]);

  const displayInfo = getDisplayInfo();

  const handlePlaylistMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setSelectedTrack(currentTrack);
    setPlaylistAnchorEl(event.currentTarget);
  }, [currentTrack]);

  const handlePlaylistMenuClose = useCallback(() => {
    setPlaylistAnchorEl(null);
    setSelectedTrack(null);
  }, []);

  const handleAddToPlaylist = useCallback((playlistId) => {
    if (!selectedTrack) return;

    try {
      // Get existing playlists from localStorage
      const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
      const playlist = playlists.find(p => p.id === playlistId);

      if (playlist) {
        // Check if track already exists in playlist
        if (!playlist.tracks.some(track => track.id === selectedTrack.id)) {
          // Add track to playlist
          playlist.tracks.push({
            id: selectedTrack.id,
            title: selectedTrack.title || selectedTrack.name,
            artist: selectedTrack.artist || selectedTrack.primaryArtists,
            image: selectedTrack.image?.[0]?.link || selectedTrack.coverUrl,
            downloadUrl: selectedTrack.downloadUrl,
            duration: selectedTrack.duration,
            addedAt: new Date().toISOString()
          });

          // Save updated playlists
          localStorage.setItem('playlists', JSON.stringify(playlists));
          enqueueSnackbar(`Added to ${playlist.name}`, { variant: 'success' });
        } else {
          enqueueSnackbar('Track already in playlist', { variant: 'info' });
        }
      }
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      enqueueSnackbar('Failed to add to playlist', { variant: 'error' });
    }

    handlePlaylistMenuClose();
  }, [selectedTrack, enqueueSnackbar]);

  const handleDownload = useCallback(async () => {
    if (!currentTrack || isDownloading) return;
    
    try {
      setIsDownloading(true);
      enqueueSnackbar('Starting download...', { variant: 'info' });
      console.log('Download started for:', currentTrack.name);

      // First get the download URL from the track
      if (!currentTrack.downloadUrl || !currentTrack.downloadUrl.length) {
        throw new Error('No download URL available');
      }
      console.log('Download URLs available:', currentTrack.downloadUrl);

      // Map quality settings
      const qualityMap = {
        '96kbps': '96',
        '160kbps': '160',
        '320kbps': '320'
      };

      const targetQuality = qualityMap[downloadQuality] || '320';
      console.log('Requested download quality:', targetQuality);

      // Sort URLs by quality
      const sortedUrls = [...currentTrack.downloadUrl].sort((a, b) => {
        const qualityA = parseInt(a.quality);
        const qualityB = parseInt(b.quality);
        return Math.abs(qualityA - parseInt(targetQuality)) - Math.abs(qualityB - parseInt(targetQuality));
      });

      console.log('Sorted download URLs:', sortedUrls);

      // Get the best matching quality URL
      const selectedUrl = sortedUrls[0];
      if (!selectedUrl || !selectedUrl.url) {
        throw new Error('No suitable quality URL found');
      }

      console.log('Selected quality URL:', selectedUrl.url);

      // Download the file
      const response = await fetch(selectedUrl.url, {
        headers: {
          'Accept': 'audio/mpeg'
        }
      });
      console.log('Download response status:', response.status);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      console.log('Blob size:', blob.size);

      // Verify file size
      const durationInSeconds = currentTrack.duration || 180;
      const expectedSize = (parseInt(selectedUrl.quality) * 1024 * durationInSeconds) / 8;
      console.log('Expected size:', expectedSize);

      // Save to IndexedDB
      await audioStorage.saveSong({
        ...currentTrack,
        quality: selectedUrl.quality,
        size: blob.size,
        downloadDate: new Date().toISOString()
      }, blob);
      console.log('Song saved successfully:', currentTrack.id);

      // Update downloads in localStorage
      const downloads = JSON.parse(localStorage.getItem('downloads') || '[]');
      const downloadEntry = {
        id: currentTrack.id,
        name: currentTrack.name,
        artist: currentTrack.primaryArtists,
        duration: currentTrack.duration,
        quality: selectedUrl.quality,
        size: blob.size,
        downloadDate: new Date().toISOString(),
        thumbnail: currentTrack.image?.[2]?.url || currentTrack.image?.[1]?.url || currentTrack.image?.[0]?.url
      };

      // Add to downloads if not already present
      if (!downloads.some(d => d.id === currentTrack.id)) {
        downloads.push(downloadEntry);
        localStorage.setItem('downloads', JSON.stringify(downloads));
        console.log('Download entry added to localStorage:', downloadEntry);
      }

      // Dispatch event to notify Downloads page
      window.dispatchEvent(new Event('downloadComplete'));
      console.log('Download complete event dispatched.');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.name} (${selectedUrl.quality}kbps).mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('Download link clicked for:', currentTrack.name);

      enqueueSnackbar('Download completed successfully', { variant: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download song');
      enqueueSnackbar('Failed to download song', { variant: 'error' });
    } finally {
      setIsDownloading(false);
      console.log('Setting isDownloading to false.');
    }
  }, [currentTrack, downloadQuality, enqueueSnackbar, isDownloading]);

  const handleContinuousPlay = useCallback(async () => {
    if (!currentTrack) return;

    setIsContinuousPlay(prev => !prev);
    if (!isContinuousPlay && queue.length === 0) {
      try {
        setIsLoading(true);
        // Get similar songs based on current track
        const response = await fetch(`https://saavn.me/search/songs?query=${encodeURIComponent(currentTrack.title + ' ' + currentTrack.artist)}&limit=20`);
        const data = await response.json();
        
        if (data.data.results) {
          const newSongs = data.data.results
            .filter(song => song.id !== currentTrack.id)
            .map(song => {
              // Map the download URLs to match our expected format
              const downloadUrls = song.downloadUrl.map(url => ({
                quality: url.quality,
                url: url.link
              }));

              // Get the URL for current quality setting
              const selectedQuality = getUrlForQuality(downloadUrls, streamingQuality);

              return {
                id: song.id,
                title: song.name,
                artist: song.primaryArtists,
                artwork: song.image?.[2]?.link || '/default-artwork.png',
                downloadUrl: downloadUrls, // Keep all download URLs for quality switching
                url: selectedQuality?.url, // Use the selected quality URL
                duration: song.duration
              };
            });

          // Shuffle the songs
          const shuffledSongs = [...newSongs].sort(() => Math.random() - 0.5);
          onQueueItemClick(shuffledSongs);
          enqueueSnackbar('Added similar songs to queue', { variant: 'success' });
        }
      } catch (error) {
        console.error('Error fetching similar songs:', error);
        enqueueSnackbar('Failed to create continuous play queue', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentTrack, isContinuousPlay, queue.length, onQueueItemClick, enqueueSnackbar, streamingQuality, getUrlForQuality]);

  // Effect hooks
  useEffect(() => {
    if (currentTrack) {
      loadAndPlayTrack();
    }
  }, [currentTrack]);

  useEffect(() => {
    if (currentTrack) {
      const likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
      setIsLiked(likedSongs.some(song => song.id === currentTrack.id));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (currentTrack) {
      setPlayHistory(prev => {
        const newHistory = prev.filter(track => track.id !== currentTrack.id);
        return [currentTrack, ...newHistory].slice(0, 50); // Keep last 50 tracks
      });
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      if (queue.length > 0) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [handleTimeUpdate, handleNext, queue.length]);

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }
  }, [timerIntervalId]);

  useEffect(() => {
    const audio = audioRef.current;
    
    const handlePlay = () => {
      if (currentTrack && currentTrack.id) {
        addToRecentlyPlayed({
          ...currentTrack,
          timestamp: new Date().getTime()
        });
      }
    };

    audio.addEventListener('play', handlePlay);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
    };
  }, [currentTrack, addToRecentlyPlayed]);

  // Early return if no track is playing
  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <Box
        onClick={(e) => {
          // Only expand if not clicking on a control
          if (!e.target.closest('button') && !e.target.closest('.MuiSlider-root')) {
            !showQueue && setIsExpanded(true);
          }
        }}
        sx={{
          position: "fixed",
          bottom: { xs: "54px", sm: 0 }, // Add space for bottom nav on mobile
          left: { xs: '0px', sm: '0px' }, // Shift left to accommodate sidebar
          right: 0,
          bgcolor: "#282828",
          p: { xs: 1, sm: 2 },
          display: "flex",
          alignItems: "center",
          height: { xs: "70px", sm: "90px" },
          cursor: "pointer",
          "&:hover": {
            bgcolor: "#333333",
          },
          marginLeft: { xs: 0, sm: 0, md: '18%' }, // No margin for xs and sm, 15% margin for md and above
          zIndex: 1200, // Ensure player stays above other content
        }}
      >
        {/* Player Content */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            cursor: "pointer",
          }}
        >
          {/* Track Info */}
          <Box
            sx={{
              width: { xs: "50%", sm: "5000%" },
              display: "flex",
              alignItems: "center",
              gap: 2,
              overflow: "hidden"
            }}
          >
            {displayInfo?.image && (
              <Box
                component="img"
                src={displayInfo.image}
                alt={displayInfo.title}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  objectFit: "cover",
                  flexShrink: 0
                }}
              />
            )}
            <Box sx={{ 
              minWidth: 0,
              flex: 1
            }}>
              <Box sx={{
                display: "flex",
                alignItems: "center",
                gap: 1
              }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "white",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {displayInfo?.title}
                </Typography>
                {displayInfo?.isOffline && (
                  <Download
                    sx={{
                      fontSize: 16,
                      color: "#1db954",
                      flexShrink: 0
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {displayInfo?.artist}
              </Typography>
            </Box>
          </Box>

          {/* Player Controls */}
          <Box
            sx={{
              width: { xs: "45%", sm: "40%" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0
            }}
          >
            {/* Playback Controls */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
              marginLeft: { xs: 0, sm: 0, md: '298%' },
            }}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                disabled={!hasPrevious}
                sx={{ 
                  color: "white",
                  padding: { xs: "4px", sm: "8px" }
                }}
              >
                <SkipPrevious sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }} />
              </IconButton>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                sx={{ 
                  color: "white",
                  padding: { xs: "4px", sm: "8px" }
                }}
              >
                {isPlaying ? (
                  <Pause sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem" } }} />
                ) : (
                  <PlayArrow sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem" } }} />
                )}
              </IconButton>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={!hasNext}
                sx={{ 
                  color: "white",
                  padding: { xs: "4px", sm: "8px" }
                }}
              >
                <SkipNext sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }} />
              </IconButton>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ 
              width: { xs: "150px", sm: "300%" }, 
              display: "flex", 
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 1, sm: 3 },
              px: { xs: 1, sm: 2 },
              marginLeft: { xs: 0, sm: 0, md: '298%' },
                
            }}>
              <Typography variant="caption" color="text.secondary">
                {formatTime(currentTime)}
              </Typography>
              <Slider
                size="small"
                value={((currentTime / duration) * 100) || 0}
                onChange={handleSliderChange}
                onChangeCommitted={handleSliderChangeCommitted}
                sx={{
                  color: "#1db954",
                  height: 4,
                  "& .MuiSlider-thumb": {
                    width: 8,
                    height: 8,
                    "&:hover, &.Mui-focusVisible": {
                      boxShadow: "0px 0px 0px 8px rgba(29, 185, 84, 0.16)",
                    },
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>

          {/* Additional Controls */}
          <Box
            sx={{
              width: { xs: "20%", sm: "30%" },
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
              
            }}
          >
            

            {/* Volume Controls - Only show on larger screens */}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                position: "absolute",
                right: 40,
                top: "50%",
                transform: "translateY(-20%)",
              }}
            >
              {volumeControls}
            </Box>

            {/* Queue Button */}
            <IconButton 
              sx={{ 
                color: "white",
                padding: { xs: "4px", sm: "8px" },
                alignItems: "center",
                position: "absolute",
                right: { xs: "3px", sm: 200 },
                top: "50%",
                transform: "translateY(-20%)",
                
              }} 
              onClick={(e) => {
                e.stopPropagation();
                handleQueueClick(e);
              }}
            >
              <QueueMusic sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
            </IconButton>

            {/* Continuous Play Button */}
            <Tooltip title={isContinuousPlay ? "Continuous Play On" : "Continuous Play Off"}>
              <IconButton
                onClick={handleContinuousPlay}
                color={isContinuousPlay ? "primary" : "default"}
                disabled={isLoading}
              >
                <PlaylistPlay />
              </IconButton>
            </Tooltip>
            {isLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Box>
        </Box>
      </Box>

      <QueueDrawer
        open={showQueue}
        onClose={() => setShowQueue(false)}
        queue={queue}
        onQueueItemClick={onQueueItemClick}
      />
      <Menu
        anchorEl={playlistAnchorEl}
        open={Boolean(playlistAnchorEl)}
        onClose={handlePlaylistMenuClose}
      >
        {JSON.parse(localStorage.getItem('playlists') || '[]').map((playlist) => (
          <MenuItem 
            key={playlist.id}
            onClick={() => handleAddToPlaylist(playlist.id)}
          >
            {playlist.name}
          </MenuItem>
        ))}
        {JSON.parse(localStorage.getItem('playlists') || '[]').length === 0 && (
          <MenuItem disabled>No playlists available</MenuItem>
        )}
      </Menu>
      <ExpandedPlayer
        open={isExpanded}
        onClose={handleExpandedClose}
        currentTrack={currentTrack}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        queue={queue}
        onQueueClick={handleQueueClick}
        sleepTimer={timerDuration}
        onSleepTimerSet={handleTimerSet}
        onQueueItemClick={onQueueItemClick}
        onDownload={handleDownload}
        onTimeChange={handleSliderChange}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      >
        {playerControls}
      </ExpandedPlayer>
    </>
  );
};

export default memo(Player);
