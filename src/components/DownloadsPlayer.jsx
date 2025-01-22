import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  VolumeUp,
  VolumeOff,
  Download,
  Timer,
} from '@mui/icons-material';
import { useDownloadsAudio } from '../contexts/DownloadsAudioContext';
import { useAudio } from '../contexts/AudioContext';
import giphy from '../assets/giphy.gif';

const sleepTimerOptions = [
  { label: 'Off', value: 0 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

const DownloadsPlayer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sleepTimer, setSleepTimer] = useState(0);
  const [sleepTimerAnchor, setSleepTimerAnchor] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    handlePlay,
    handlePause,
    handleNext,
    handlePrevious,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    isDownloadsActive,
  } = useDownloadsAudio();

  const { setShowPlayer: setShowMainPlayer } = useAudio();

  useEffect(() => {
    // Hide main player when downloads player is active
    if (isDownloadsActive) {
      setShowMainPlayer(false);
    }
  }, [isDownloadsActive, setShowMainPlayer]);

  useEffect(() => {
    let timer;
    if (sleepTimer > 0 && isPlaying) {
      const endTime = Date.now() + sleepTimer * 60 * 1000;
      timer = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        if (remaining === 0) {
          handlePause();
          setSleepTimer(0);
          clearInterval(timer);
        } else {
          setRemainingTime(Math.floor(remaining / 1000));
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sleepTimer, isPlaying, handlePause]);

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else if (currentTrack) {
      handlePlay(currentTrack);
    }
  };

  const handleSleepTimerClick = (event) => {
    setSleepTimerAnchor(event.currentTarget);
  };

  const handleSleepTimerClose = () => {
    setSleepTimerAnchor(null);
  };

  const handleSleepTimerSelect = (value) => {
    setSleepTimer(value);
    setSleepTimerAnchor(null);
  };

  const formatSleepTime = (seconds) => {
    if (seconds === 0) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack || !isDownloadsActive) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 58, sm: 0 },
        left: { xs: 0, sm: 240 },
        right: 0,
        bgcolor: '#282828',
        padding: 0.3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        gap: 0,
        zIndex: 1000,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          width: { xs: '100%', sm: '30%' },
          minWidth: { sm: '180px' },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: 1,
            bgcolor: '#282828',
          }}
        >
          <Box
            component="img"
            src={giphy}
            alt="."
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isPlaying ? 0.8 : 0.5,
              transition: 'opacity 0.3s ease',
            }}
          />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              color: 'white',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.title || currentTrack.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.artist || currentTrack.primaryArtists}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          flex: 1,
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={handlePrevious}
            sx={{ color: 'white' }}
            size={isMobile ? 'small' : 'medium'}
          >
            <SkipPrevious />
          </IconButton>
          <IconButton
            onClick={handlePlayPause}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
            size={isMobile ? 'medium' : 'large'}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{ color: 'white' }}
            size={isMobile ? 'small' : 'medium'}
          >
            <SkipNext />
          </IconButton>
          <IconButton
            onClick={handleSleepTimerClick}
            sx={{ 
              color: sleepTimer > 0 ? '#1db954' : 'white',
              position: 'relative',
            }}
            size="small"
          >
            <Timer />
            {sleepTimer > 0 && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#1db954',
                  fontSize: '0.6rem',
                }}
              >
                {formatSleepTime(remainingTime)}
              </Typography>
            )}
          </IconButton>
        </Box>

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: { xs: 0, sm: 2 },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
            {formatTime(currentTime)}
          </Typography>
          <Slider
            size="small"
            value={currentTime}
            max={duration}
            onChange={(_, value) => handleSeek(value)}
            sx={{
              color: '#1db954',
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: 'none',
                },
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>

      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '200px',
            justifyContent: 'flex-end',
          }}
        >
          <IconButton
            onClick={handleToggleMute}
            sx={{ color: 'white' }}
            size="small"
          >
            {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
          </IconButton>
          <Slider
            size="small"
            value={isMuted ? 0 : volume}
            max={1}
            min={0}
            step={0.01}
            onChange={(_, value) => handleVolumeChange(value)}
            sx={{
              width: 100,
              color: '#1db954',
              '& .MuiSlider-rail': {
                opacity: 0.3,
              },
            }}
          />
        </Box>
      )}

      <Menu
        anchorEl={sleepTimerAnchor}
        open={Boolean(sleepTimerAnchor)}
        onClose={handleSleepTimerClose}
        PaperProps={{
          sx: {
            bgcolor: '#282828',
            color: 'white',
          },
        }}
      >
        {sleepTimerOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSleepTimerSelect(option.value)}
            selected={sleepTimer === option.value}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'rgba(29, 185, 84, 0.3)',
              },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default DownloadsPlayer;
