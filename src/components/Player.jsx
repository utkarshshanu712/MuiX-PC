import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
  useMemo,
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
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeOff,
  QueueMusic,
  Close,
  Timer,
  Favorite,
  FavoriteBorder,
  PlaylistAdd,
  Download,
  Lyrics,
} from "@mui/icons-material";
import ExpandedPlayer from "./ExpandedPlayer";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLibrary } from "../contexts/LibraryContext";
import { useSettings } from '../contexts/SettingsContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import PlaylistMenu from "./PlaylistMenu";

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
  const audioRef = useRef(new Audio());
  const { streamingQuality, downloadQuality, getUrlForQuality } = useSettings();
  const { addToRecentlyPlayed } = useUserPreferences();
  const { likedSongs, toggleLikeSong } = useLibrary();
  const [volume, setVolume] = useLocalStorage("playerVolume", 1);
  const [isMuted, setIsMuted] = useLocalStorage("playerMuted", false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [timerAnchorEl, setTimerAnchorEl] = useState(null);
  const [timerDuration, setTimerDuration] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [playHistory, setPlayHistory] = useState([]);
  const [playlistAnchor, setPlaylistAnchor] = useState(null);
  const isLiked = currentTrack
    ? likedSongs.some((song) => song.id === currentTrack.id)
    : false;

  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    if (currentTrack?.image) {
      const highestQualityImage = currentTrack.image.reduce((prev, curr) => {
        const prevQuality = parseInt(prev.quality.split('x')[0]);
        const currQuality = parseInt(curr.quality.split('x')[0]);
        return currQuality > prevQuality ? curr : prev;
      }, currentTrack.image[0]);
      setThumbnailUrl(highestQualityImage.url);
    } else if (currentTrack?.metadata?.thumbnailUrl) {
      setThumbnailUrl(currentTrack.metadata.thumbnailUrl);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (currentTrack?.isLocal && currentTrack?.thumbnailBlob) {
      const blob = new Blob([currentTrack.thumbnailBlob], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [currentTrack]);

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
      setQueuePosition((prev) => prev + 1);
      onNext();
    }
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    if (currentTime > 3) {
      // If current time > 3 seconds, restart the current track
      audioRef.current.currentTime = 0;
    } else if (playHistory.length > 0) {
      // Go to previous track in history
      const previousTrack = playHistory[playHistory.length - 1];
      setPlayHistory(prev => prev.slice(0, -1));
      onQueueItemClick(previousTrack, queuePosition - 1);
      setQueuePosition(prev => prev - 1);
    } else if (hasPrevious) {
      onPrevious();
    }
  }, [currentTime, playHistory, hasPrevious, onPrevious, onQueueItemClick, queuePosition]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      if (queuePosition < queue.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate, handleNext, queue.length, queuePosition]);

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

  const handleQueueClick = useCallback((e) => {
    e?.stopPropagation();
    setShowQueue(true);
  }, []);

  const handleCloseQueue = useCallback(() => {
    setShowQueue(false);
  }, []);

  const handleExpandedClose = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleQueueItemClick = useCallback((song, index) => {
    setQueuePosition(index);
    onQueueItemClick(song, index);
    handleCloseQueue();
  }, [onQueueItemClick, handleCloseQueue]);

  useEffect(() => {
    if (!currentTrack) return;

    const audioUrl = getUrlForQuality(currentTrack.downloadUrl, streamingQuality);
    audioRef.current.src = audioUrl;
    
    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setError(error.message || 'Failed to play audio. Please try again.');
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [currentTrack, streamingQuality, getUrlForQuality, isPlaying]);

  useEffect(() => {
    if (currentTrack && isPlaying) {
      addToRecentlyPlayed(currentTrack);
    }
  }, [currentTrack, isPlaying, addToRecentlyPlayed]);

  const handlePlayPause = useCallback(() => {
    if (error) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setError(error.message || 'Failed to play audio. Please try again.');
      });
    }
    setIsPlaying(!isPlaying);
  }, [error, isPlaying]);

  const handleVolumeChange = useCallback((event, newValue) => {
    const volume = Math.max(0, Math.min(newValue / 100, 1));
    setVolume(volume);
    audioRef.current.volume = volume;
  }, [setVolume]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted, setIsMuted]);

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimerDisplay = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimerClick = (event) => {
    setTimerAnchorEl(event.currentTarget);
  };

  const handleTimerClose = () => {
    setTimerAnchorEl(null);
  };

  const handleTimerSet = (minutes) => {
    if (!minutes) {
      setTimerDuration(null);
      setTimerRemaining(null);
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      setTimerDuration(endTime);
      setTimerRemaining(minutes * 60);
    }
    handleTimerClose();
  };

  useEffect(() => {
    if (!timerDuration) {
      setTimerRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((timerDuration - now) / 1000));
      
      if (remaining <= 0) {
        clearInterval(interval);
        setTimerDuration(null);
        setTimerRemaining(null);
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        setTimerRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerDuration, isPlaying]);

  const handleDownload = useCallback(async (track) => {
    if (!track) return;
    
    try {
      // Get URL for selected quality
      const selectedQualityUrl = getUrlForQuality(track.downloadUrl, downloadQuality);
      
      if (!selectedQualityUrl) {
        throw new Error('No download URL available for quality: ' + downloadQuality);
      }

      // Fetch the audio file
      const response = await fetch(selectedQualityUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }
      const arrayBuffer = await response.arrayBuffer();

      // Clean text helper
      const cleanText = (text) => {
        return (text || '')
          .replace(/[^\x20-\x7E]/g, '_')
          .replace(/[\\/:"*?<>|]+/g, '_')
          .slice(0, 30)
          .trim();
      };

      // Prepare metadata
      const metadata = {
        title: cleanText(track.name || track.title || 'Unknown Title'),
        artist: cleanText(track.primaryArtists || track.artists?.primary?.[0]?.name || 'Unknown Artist'),
        album: cleanText(track.album?.name || ''),
        year: (track.year || new Date().getFullYear()).toString().slice(0, 4),
        comments: cleanText(downloadQuality)
      };

      // Create ID3v1 tag
      const id3v1Buffer = createID3v1Buffer(metadata);
      
      if (!id3v1Buffer) {
        throw new Error('Failed to create ID3 tags');
      }

      // Combine audio data with ID3v1 tag at the end
      const finalBuffer = new Uint8Array(arrayBuffer.byteLength + id3v1Buffer.length);
      finalBuffer.set(new Uint8Array(arrayBuffer), 0);
      finalBuffer.set(id3v1Buffer, arrayBuffer.byteLength);

      // Create blob with proper MIME type
      const blob = new Blob([finalBuffer], { 
        type: 'audio/mpeg; codecs="mp3"'
      });

      // Generate safe filename
      const filename = `${cleanText(metadata.title)}.mp3`;

      // Try using download attribute first
      try {
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.warn('Standard download failed, trying alternative method:', error);
        
        // Fallback method for IE
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
          // Another fallback using data URL
          const reader = new FileReader();
          reader.onload = function() {
            const a = document.createElement('a');
            a.href = reader.result;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          };
          reader.readAsDataURL(blob);
        }
      }

      console.log('Download completed successfully');
    } catch (error) {
      console.error('Error downloading song:', error);
      throw error;
    }
  }, [downloadQuality]);

  const playerControls = useMemo(
    () => (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <IconButton
            onClick={handlePrevious}
            disabled={!hasPrevious}
            sx={{ color: "white" }}
          >
            <SkipPrevious />
          </IconButton>
          <IconButton
            onClick={handlePlayPause}
            disabled={!currentTrack}
            sx={{
              color: "white",
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton
            onClick={handleNext}
            disabled={!hasNext}
            sx={{ color: "white" }}
          >
            <SkipNext />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
            {formatTime(currentTime)}
          </Typography>
          <Slider
            value={(currentTime / duration) * 100 || 0}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            aria-label="Progress"
            sx={{
              color: "white",
              height: 4,
              '& .MuiSlider-thumb': {
                width: 8,
                height: 8,
                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                '&:before': {
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                },
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0px 0px 0px 8px rgba(255, 255, 255, 0.16)',
                },
                '&.Mui-active': {
                  width: 12,
                  height: 12,
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.28,
              },
              '& .MuiSlider-track': {
                transition: 'width 0.1s linear',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>
    ),
    [isPlaying, hasNext, hasPrevious, currentTime, duration, error]
  );

  const trackControls = useMemo(
    () => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={handleTimerClick} sx={{ color: "white" }}>
          <Badge
            badgeContent={timerRemaining ? formatTimerDisplay(timerRemaining) : null}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                padding: '0 4px',
                minWidth: '24px',
                height: '20px',
              }
            }}
          >
            <Timer color={timerDuration ? "primary" : "inherit"} />
          </Badge>
        </IconButton>
        <IconButton onClick={onLyricsClick} sx={{ color: "white" }}>
          <Lyrics />
        </IconButton>
        <IconButton onClick={(e) => {
          e.stopPropagation();
          toggleLikeSong(currentTrack);
        }} sx={{ color: isLiked ? "#1db954" : "white" }}>
          {isLiked ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setPlaylistAnchor(e.currentTarget);
          }}
          sx={{ color: "white" }}
        >
          <PlaylistAdd />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(currentTrack).catch(error => {
              console.error('Download failed:', error);
            });
          }}
          sx={{ color: "white" }}
        >
          <Download />
        </IconButton>
      </Box>
    ),
    [timerDuration, timerRemaining, isLiked]
  );

  const volumeControls = useMemo(
    () => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton sx={{ color: "white" }} onClick={toggleMute}>
          {isMuted ? <VolumeOff /> : <VolumeUp />}
        </IconButton>
        <Slider
          value={isMuted ? 0 : volume * 100}
          onChange={handleVolumeChange}
          aria-label="Volume"
          sx={{
            width: 100,
            color: "white",
            "& .MuiSlider-track": {
              border: "none",
            },
            "& .MuiSlider-thumb": {
              width: 12,
              height: 12,
              backgroundColor: "#fff",
              "&:before": {
                boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
              },
              "&:hover, &.Mui-focusVisible, &.Mui-active": {
                boxShadow: "none",
              },
            },
          }}
        />
      </Box>
    ),
    [volume, isMuted]
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

  if (!currentTrack) {
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "#282828",
          p: 2,
          height: "90px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No track selected
        </Typography>
      </Box>
    );
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
          bottom: { xs: "56px", sm: 0 }, // Add space for bottom nav on mobile
          left: 0,
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
        {/* Track Info */}
        <Box
          sx={{
            width: { xs: "35%", sm: "30%" },
            display: "flex",
            alignItems: "center",
            gap: { xs: 2, sm: 2, md: 0 }, 
            overflow: "hidden"
          }}
        >
          {currentTrack?.image && (
            <Box
              component="img"
              src={thumbnailUrl || "/default-album-art.png"}
              alt={currentTrack.name}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                objectFit: "cover",
              }}
            />
          )}
          <Box sx={{ 
            ml: currentTrack?.image ? 0 : 2,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis"
          }}>
            <Typography 
              variant="subtitle1" 
              color="white"
              sx={{
                fontSize: { xs: "0.875rem", sm: "1rem" },
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {currentTrack?.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {currentTrack?.primaryArtists ||
                currentTrack?.artists?.primary?.[0]?.name}
            </Typography>
          </Box>
          {/* Only show track controls on larger screens */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
            {trackControls}
          </Box>
        </Box>

        {/* Player Controls */}
        <Box
          sx={{
            width: { xs: "45%", sm: "40%" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {playerControls}
        </Box>

        {/* Volume and Queue Controls */}
        <Box
          sx={{
            width: { xs: "20%", sm: "30%" },
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          {/* Only show volume controls on larger screens */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
            {volumeControls}
          </Box>
          {/* Show queue button on all screens */}
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

        {/* Error Message */}
        {error && (
          <Typography
            sx={{
              position: "absolute",
              top: -30,
              left: "50%",
              transform: "translateX(-50%)",
              color: "error.main",
              bgcolor: "background.paper",
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              whiteSpace: "nowrap"
            }}
          >
            {error}
          </Typography>
        )}
      </Box>

      <QueueDrawer
        open={showQueue}
        onClose={handleCloseQueue}
        queue={queue}
        onQueueItemClick={handleQueueItemClick}
      />
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
        onDownload={() => currentTrack && handleDownload(currentTrack).catch(error => {
          console.error('Download failed:', error);
        })}
        onTimeChange={handleSliderChange}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      >
        {playerControls}
      </ExpandedPlayer>
      <PlaylistMenu
        anchorEl={playlistAnchor}
        onClose={() => setPlaylistAnchor(null)}
        song={currentTrack}
      />
    </>
  );
};

export default memo(Player);
