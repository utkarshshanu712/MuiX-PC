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

  const handleDownload = async (track) => {
    try {
      const response = await fetch(track.downloadUrl[0].url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.name}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Save downloaded song to localStorage
      const downloadedSongs = JSON.parse(localStorage.getItem('downloadedSongs') || '[]');
      const songExists = downloadedSongs.some(song => song.id === track.id);
      
      if (!songExists) {
        const songData = {
          ...track,
          isLocal: true,
          downloadTime: new Date().toISOString()
        };
        downloadedSongs.push(songData);
        localStorage.setItem('downloadedSongs', JSON.stringify(downloadedSongs));
      }
    } catch (error) {
      console.error('Error downloading song:', error);
    }
  };

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
            handleDownload(currentTrack);
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
            <img
              src={
                currentTrack.image[2]?.url ||
                currentTrack.image[1]?.url ||
                currentTrack.image[0]?.url
              }
              alt={currentTrack.name}
              style={{
                width: "60px",
                height: "60px",
                marginRight: "2px",
                marginLeft: "2px",
                borderRadius: "4px",
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
        onQueueItemClick={handleQueueItemClick} // Use the prop directly
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
        onDownload={() => currentTrack && handleDownload(currentTrack)}
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
