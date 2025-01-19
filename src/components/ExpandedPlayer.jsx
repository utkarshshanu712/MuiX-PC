import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Typography, IconButton, Drawer, CircularProgress, Menu, MenuItem, Badge, Slider } from '@mui/material';
import { KeyboardArrowDown, Lyrics, QueueMusic, Timer, PlaylistAdd, Favorite, FavoriteBorder, Download, PlayArrow, Pause, SkipPrevious, SkipNext } from '@mui/icons-material';
import { useLibrary } from '../contexts/LibraryContext';
import PlaylistMenu from './PlaylistMenu';

const SLEEP_TIMER_OPTIONS = [
  { label: '2 minutes', value: 2 },
  { label: '5 minutes', value: 5 },
  { label: '20 minutes', value: 20 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: '80 minutes', value: 80 },
  { label: '120 minutes', value: 120 },
];

const ExpandedPlayer = ({ 
  open, 
  onClose, 
  currentTrack, 
  currentTime, 
  duration,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  queue = [], 
  onQueueClick, 
  sleepTimer, 
  onSleepTimerSet,
  onDownload,
  onTimeChange,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute
}) => {
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);
  const lyricsRef = useRef(null);
  const [sleepTimerAnchor, setSleepTimerAnchor] = useState(null);
  const [playlistAnchor, setPlaylistAnchor] = useState(null);
  const { likedSongs, toggleLikeSong } = useLibrary();
  
  const isLiked = currentTrack ? likedSongs.some(s => s.id === currentTrack.id) : false;

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentTrack?.id) return;
      
      setLoading(true);
      setError(null);

      try {
        // First check if lyrics are already in the track object
        if (currentTrack.lyrics) {
          setLyrics(currentTrack.lyrics);
          setLoading(false);
          return;
        }

        // If not, try to fetch from API using a CORS proxy
        const lyricsUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&ctx=web6dot0&api_version=4&_format=json&_marker=0%3F_marker%3D0&lyrics_id=${currentTrack.id}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(lyricsUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.text();
        let data;
        
        try {
          data = JSON.parse(rawData);
        } catch (e) {
          console.error('Failed to parse lyrics JSON:', e);
          throw new Error('Invalid lyrics data format');
        }
        
        if (data && data.lyrics) {
          setLyrics(data.lyrics);
        } else if (currentTrack.lyrics) {
          // Fallback to track lyrics if API fails
          setLyrics(currentTrack.lyrics);
        } else {
          setError('No lyrics available for this song');
        }
      } catch (error) {
        console.error('Error fetching lyrics:', error);
        // Fallback to track lyrics if fetch fails
        if (currentTrack.lyrics) {
          setLyrics(currentTrack.lyrics);
        } else {
          setError('Unable to load lyrics. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentTrack?.lyrics) {
      setLyrics(currentTrack.lyrics);
    } else {
      fetchLyrics();
    }
  }, [currentTrack?.id, currentTrack?.lyrics]);

  useEffect(() => {
    if (currentTrack?.lyrics && duration > 0) {
      const lines = formatLyrics(currentTrack.lyrics);
      const { currentLine } = getVisibleLyrics(currentTime, lines.length);
      setActiveLyricIndex(currentLine);

      if (lyricsRef.current) {
        const activeLyric = lyricsRef.current.querySelector(`[data-line-index="${currentLine}"]`);
        if (activeLyric) {
          activeLyric.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [currentTime, currentTrack?.lyrics, duration]);

  useEffect(() => {
    const handleEnded = () => {
      if (hasNext) {
        onNext();
      }
    };

    if (currentTrack) {
      const audio = document.querySelector('audio');
      if (audio) {
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
      }
    }
  }, [currentTrack, hasNext, onNext]);

  const formatLyrics = (lyricsText) => {
    if (!lyricsText) return [];
    return lyricsText
      .replace(/<br\s*\/?>/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  };

  const getVisibleLyrics = (currentTime, totalLines) => {
    const linesPerGroup = 4;
    const duration = currentTrack?.duration || 0;

    if (duration && totalLines) {
      const adjustedTime = Math.max(0, currentTime - 1);
      const timePerLine = (duration - 1) / totalLines;
      const currentLine = Math.floor(adjustedTime / timePerLine);

      return {
        startIndex: Math.max(0, currentLine - 1),
        endIndex: Math.min(currentLine + linesPerGroup, totalLines),
        currentLine
      };
    }

    return { startIndex: 0, endIndex: linesPerGroup, currentLine: 0 };
  };

  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setSliderValue((currentTime / duration) * 100 || 0);
    }
  }, [currentTime, duration, isDragging]);

  const handleSliderChange = (_, newValue) => {
    setSliderValue(newValue);
    const newTime = (newValue / 100) * duration;
    if (!isNaN(newTime) && isFinite(newTime)) {
      onTimeChange(_, newValue);
    }
  };

  const handleSliderDragStart = () => {
    setIsDragging(true);
  };

  const handleSliderDragEnd = () => {
    setIsDragging(false);
  };

  const playerControls = useMemo(() => (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton
          onClick={onPrevious}
          disabled={!hasPrevious}
          sx={{ color: hasPrevious ? 'white' : 'gray', '&:disabled': { color: 'gray' } }}
        >
          <SkipPrevious />
        </IconButton>
        <IconButton
          sx={{ color: 'white', mx: 2, transform: 'scale(1.5)' }}
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton
          onClick={onNext}
          disabled={!hasNext}
          sx={{ color: hasNext ? 'white' : 'gray', '&:disabled': { color: 'gray' } }}
        >
          <SkipNext />
        </IconButton>
        <IconButton onClick={onQueueClick} sx={{ color: 'white', ml: 1 }}>
          <QueueMusic />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Typography sx={{ color: 'text.secondary', mr: 1, minWidth: 35 }}>
          {formatTime(currentTime)}
        </Typography>
        <Slider
          size="small"
          value={sliderValue}
          max={100}
          onChange={handleSliderChange}
          onMouseDown={handleSliderDragStart}
          onMouseUp={handleSliderDragEnd}
          onTouchStart={handleSliderDragStart}
          onTouchEnd={handleSliderDragEnd}
          sx={{
            color: '#1db954',
            height: 4,
            padding: '15px 0',
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              backgroundColor: '#fff',
              transition: '0.2s cubic-bezier(.47,1.64,.41,.8)',
              '&:before': {
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
              },
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0px 0px 0px 8px rgba(255, 255, 255, 0.16)',
                width: 16,
                height: 16,
              },
              '&.Mui-active': {
                width: 16,
                height: 16,
              },
              '&.Mui-disabled': {
                cursor: 'not-allowed',
              },
            },
            '& .MuiSlider-rail': {
              opacity: 0.28,
              backgroundColor: '#ffffff40',
            },
            '& .MuiSlider-track': {
              border: 'none',
              transition: 'all 0.1s linear',
              backgroundColor: '#1db954',
            },
          }}
        />
        <Typography sx={{ color: 'text.secondary', ml: 1, minWidth: 35 }}>
          {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  ), [sliderValue, duration, isPlaying, hasNext, hasPrevious, onNext, onPrevious, onPlayPause, onQueueClick, isDragging]);

  const handleSleepTimerClick = (event) => {
    setSleepTimerAnchor(event.currentTarget);
  };

  const handleSleepTimerClose = () => {
    setSleepTimerAnchor(null);
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1250,
        '& .MuiDrawer-paper': {
          background: 'linear-gradient(to bottom, #535353, #121212)',
          height: '100%',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      <Box sx={{ 
        height: '100%', 
        p: 3,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4
      }}>
        {/* Left Section - Player Controls */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%', 
            mb: 4,
            alignItems: 'center'
          }}>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <KeyboardArrowDown />
            </IconButton>
            <Typography variant="subtitle1" color="white">Now Playing</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                sx={{ 
                  color: currentTrack?.lyrics ? '#1db954' : 'white',
                  '&:hover': { color: '#1db954' }
                }}
              >
                <Lyrics />
              </IconButton>
              <IconButton onClick={handleSleepTimerClick} sx={{ color: sleepTimer?.remaining ? '#1db954' : 'white' }}>
                <Timer />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ 
            width: '100%',
            maxWidth: 400,
            aspectRatio: '1',
            mb: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <img
              src={currentTrack.image?.[2]?.url || currentTrack.image?.[1]?.url || currentTrack.image?.[0]?.url}
              alt={currentTrack.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" color="white" sx={{ mb: 1 }}>
              {currentTrack.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {currentTrack.primaryArtists || currentTrack.artists?.primary?.[0]?.name}
            </Typography>
          </Box>

          <Box sx={{ width: '100%', maxWidth: 400 }}>
            {playerControls}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            <IconButton
              onClick={() => toggleLikeSong(currentTrack)}
              sx={{ color: isLiked ? '#1db954' : 'white' }}
            >
              {isLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            <IconButton
              onClick={onDownload}
              sx={{ color: 'white' }}
            >
              <Download />
            </IconButton>
            <IconButton
              onClick={(e) => setPlaylistAnchor(e.currentTarget)}
              sx={{ color: 'white' }}
            >
              <PlaylistAdd />
            </IconButton>
          </Box>
        </Box>

        {/* Right Section - Lyrics */}
        {(lyrics || currentTrack?.lyrics) && (
          <Box sx={{ 
            flex: 1.5,
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            bgcolor: 'rgba(0,0,0,0.3)',
            borderRadius: 2,
            mx: 2
          }}>
            <Typography variant="h6" sx={{ mb: 4, color: '#1db954', fontSize: '2rem' }}>
              <Lyrics sx={{ mr: 1, verticalAlign: 'middle', fontSize: '2.5rem' }} />
              Lyrics
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress sx={{ color: '#1db954' }} />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ mt: 4, color: '#ff6b6b' }}>{error}</Typography>
            ) : (
              <Box 
                ref={lyricsRef}
                sx={{
                  width: '100%',
                  maxWidth: '1000px',
                  height: '70vh',
                  overflowY: 'auto',
                  scrollBehavior: 'smooth',
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '2px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#1db954',
                    borderRadius: '2px',
                  }
                }}
              >
                <Box sx={{ py: 4 }}>
                  {formatLyrics(lyrics || currentTrack?.lyrics).map((line, index) => {
                    const { currentLine } = getVisibleLyrics(currentTime, formatLyrics(lyrics || currentTrack?.lyrics).length);
                    const isActive = Math.abs(index - currentLine) <= 2;
                    const isCurrentLine = index === currentLine;
                    
                    return (
                      <Typography
                        key={index}
                        variant="body1"
                        data-line-index={index}
                        sx={{
                          color: 'white',
                          transition: 'all 0.3s ease',
                          opacity: isActive ? 1 : 0.3,
                          fontWeight: isCurrentLine ? 700 : isActive ? 600 : 400,
                          fontSize: isCurrentLine ? '1.8rem' : isActive ? '1.6rem' : '1.2rem',
                          textAlign: 'center',
                          py: 1.2,
                          px: 2,
                          mx: 'auto',
                          lineHeight: 1.8,
                          maxWidth: '95%',
                          mb: 1
                        }}
                      >
                        {line}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={sleepTimerAnchor}
        open={Boolean(sleepTimerAnchor)}
        onClose={handleSleepTimerClose}
        PaperProps={{
          sx: {
            bgcolor: '#282828',
            color: 'white',
          }
        }}
      >
        {SLEEP_TIMER_OPTIONS.map((option) => (
          <MenuItem 
            key={option.value}
            onClick={() => {
              onSleepTimerSet(option.value);
              handleSleepTimerClose();
            }}
            sx={{
              '&:hover': {
                bgcolor: '#383838'
              }
            }}
          >
            {option.label}
          </MenuItem>
        ))}
        {sleepTimer && (
          <MenuItem
            onClick={() => {
              onSleepTimerSet(null);
              handleSleepTimerClose();
            }}
            sx={{
              color: '#ff6b6b',
              '&:hover': {
                bgcolor: '#383838'
              }
            }}
          >
            Cancel Timer
          </MenuItem>
        )}
      </Menu>

      <PlaylistMenu
        anchorEl={playlistAnchor}
        onClose={() => setPlaylistAnchor(null)}
        song={currentTrack}
      />
    </Drawer>
  );
};

export default ExpandedPlayer;
