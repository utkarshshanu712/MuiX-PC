import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  AccessTime,
  Shuffle,
  MoreVert,
  Delete,
} from '@mui/icons-material';
import { useDownloadsAudio } from '../contexts/DownloadsAudioContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import DownloadsPlayer from '../components/DownloadsPlayer';
import { audioStorage } from '../services/AudioStorage';

const Downloads = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [downloads, setDownloads] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const { handlePlay, currentTrack, isPlaying } = useDownloadsAudio();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadDownloadedSongs();
    
    const handleStorageChange = () => {
      loadDownloadedSongs();
    };
    
    window.addEventListener('downloadComplete', handleStorageChange);
    return () => window.removeEventListener('downloadComplete', handleStorageChange);
  }, []);

  useEffect(() => {
    const total = downloads.reduce((acc, song) => acc + (song.duration || 0), 0);
    setTotalDuration(total);
  }, [downloads]);

  const loadDownloadedSongs = async () => {
    try {
      const storedDownloads = JSON.parse(localStorage.getItem('downloads') || '[]');
      console.log('Stored downloads:', storedDownloads); // Check this log
      console.log('Stored downloads structure:', JSON.stringify(storedDownloads, null, 2)); // New log

      const verifiedDownloads = [];
      for (const song of storedDownloads) {
        const storedSong = await audioStorage.getSong(song.id);
        if (storedSong && storedSong.audioBlob) {
          verifiedDownloads.push({
            ...song,
            isOffline: true,
            audioBlob: storedSong.audioBlob
          });
        } else {
          console.warn(`Song ${song.id} not found in IndexedDB, removing from localStorage`);
        }
      }
      console.log('Verified downloads:', verifiedDownloads); // Check this log
      console.log('Verified downloads structure:', JSON.stringify(verifiedDownloads, null, 2)); // New log
      setDownloads(verifiedDownloads);
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  const handlePlaySong = async (song) => {
    try {
      if (!song.audioBlob) {
        // Try to get the audio blob from IndexedDB if not already loaded
        const storedSong = await audioStorage.getSong(song.id);
        if (!storedSong || !storedSong.audioBlob) {
          throw new Error('Song data not found');
        }
        song.audioBlob = storedSong.audioBlob;
      }

      // Create an object URL for the audio blob
      const objectUrl = URL.createObjectURL(song.audioBlob);

      // Get the remaining songs for queue
      const currentIndex = downloads.findIndex(track => track.id === song.id);
      const remainingTracks = downloads.slice(currentIndex + 1).map(track => ({
        ...track,
        isLocal: true,
        audioUrl: null, // Will be loaded when played
        downloadUrl: null
      }));

      const offlineTrack = {
        ...song,
        isLocal: true,
        audioUrl: objectUrl,
        downloadUrl: null,
        _cleanup: () => URL.revokeObjectURL(objectUrl)
      };

      handlePlay(offlineTrack, remainingTracks);
    } catch (error) {
      console.error('Failed to play song:', error);
      enqueueSnackbar('Failed to play song: ' + error.message, { variant: 'error' });
    }
  };

  const handlePlayAll = async (shuffle = false) => {
    if (downloads.length === 0) return;
    
    try {
      let tracksToPlay = [...downloads];
      
      if (shuffle) {
        // Fisher-Yates shuffle algorithm
        for (let i = tracksToPlay.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tracksToPlay[i], tracksToPlay[j]] = [tracksToPlay[j], tracksToPlay[i]];
        }
      }

      // Get the first song's audio blob
      const firstSong = tracksToPlay[0];
      const storedSong = await audioStorage.getSong(firstSong.id);
      if (!storedSong || !storedSong.audioBlob) {
        throw new Error('Song data not found');
      }

      // Create object URL for the first track
      const objectUrl = URL.createObjectURL(storedSong.audioBlob);
      const firstTrack = {
        ...firstSong,
        isLocal: true,
        audioUrl: objectUrl,
        downloadUrl: null,
        _cleanup: () => URL.revokeObjectURL(objectUrl)
      };

      // Create remaining tracks array
      const remainingTracks = tracksToPlay.slice(1).map(song => ({
        id: song.id,
        name: song.title || song.name,
        title: song.title || song.name,
        primaryArtists: song.artist,
        artist: song.artist,
        image: [{ link: song.coverUrl }],
        downloadUrl: null,
        isLocal: true,
        audioUrl: null,
        duration: song.duration,
        type: 'song',
        playCount: 0,
        language: song.language || 'unknown'
      }));

      // Start playback with the first track and queue the rest
      await handlePlay(firstTrack, remainingTracks);
    } catch (error) {
      console.error('Failed to start playback:', error);
      enqueueSnackbar('Failed to start playback: ' + error.message, { variant: 'error' });
    }
  };

  const handleDelete = async (songId) => {
    try {
      // Delete from IndexedDB
      await audioStorage.deleteSong(songId);
      
      // Update localStorage
      const updatedDownloads = downloads.filter(song => song.id !== songId);
      localStorage.setItem('downloads', JSON.stringify(updatedDownloads));
      setDownloads(updatedDownloads);
      
      enqueueSnackbar('Song deleted from downloads', { variant: 'success' });
    } catch (error) {
      console.error('Failed to delete song:', error);
      enqueueSnackbar('Failed to delete song', { variant: 'error' });
    }
  };

  const handleMenuOpen = (event, song) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedSong(song);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSong(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 },
      pb: { xs: '120px', sm: '100px' },
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 3,
        mb: 1,
        bgcolor: 'rgb(249 249 249 / 7%)',
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
        width: { xs: '350px', sm: '1000px' },
      }}>
        {/* <Box sx={{ 
          width: { xs: '100%', sm: 150 },
          height: { xs: 150, sm: 150 },
          bgcolor: '#282828',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2
        }}>
          <Download sx={{ fontSize: { xs: 80, sm: 100 }, color: '#1db954' }} />
        </Box> */}

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* <Typography variant="overline" color="text.secondary">Playlist</Typography> */}
          <Typography variant="h1" sx={{ 
            mb: 1, 
            fontSize: { xs: '1rem', sm: '2rem' }, 
            fontWeight: 'bold' 
          }}>
            Downloads
          </Typography>
          <Typography color="text.secondary">
            {downloads.length} songs • {Math.floor(totalDuration / 60)} minutes
          </Typography>
        </Box>
      </Box>

      {/* Play Buttons */}
      {downloads.length > 0 && (
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => handlePlayAll(false)}
            disabled={downloads.length === 0}
          >
            Play All
          </Button>
          <Button
            variant="outlined"
            startIcon={<Shuffle />}
            onClick={() => handlePlayAll(true)}
            disabled={downloads.length === 0}
          >
            Shuffle All
          </Button>
        </Box>
      )}

      {/* Songs List */}
      {downloads.length > 0 ? (
        <Box sx={{ 
          overflowX: 'auto',
          maxHeight: { xs: 'calc(100vh - 400px)', sm: 'calc(100vh - 350px)' }
        }}>
          {isMobile ? (
            // Mobile View
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {downloads.map((song, index) => (
                <Box
                  key={song.id}
                  onClick={() => handlePlaySong(song)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: currentTrack?.id === song.id ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, song)}
                    sx={{ color: 'text.secondary' }}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                  <Box sx={{ 
                    width: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: currentTrack?.id === song.id ? '#1db954' : '#adc4d1'
                  }}>
                    {currentTrack?.id === song.id ? (
                      isPlaying ? <Pause /> : <PlayArrow />
                    ) : (
                      index + 1
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: '#12cff0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {song.title || song.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="#866e58"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {song.artist} • {formatDuration(song.duration)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            // Desktop View
            <TableContainer sx={{ maxWidth: '100%' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', width: { xs: '10%', sm: '5%' } }}></TableCell>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '45%', md: '40%' } }}>Title</TableCell>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '25%', md: '30%' } }}>Artist</TableCell>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '15%', md: '15%' } }}>Date Added</TableCell>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '10%', md: '10%' } }}>
                      <AccessTime />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {downloads.map((song) => (
                    <TableRow key={song.id} onClick={() => handlePlaySong(song)}>
                      <TableCell sx={{ width: { xs: '10%', sm: '5%' } }}>
                        <IconButton onClick={(e) => handleMenuOpen(e, song)} sx={{ color: 'text.secondary' }}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                      <TableCell>{song.title || song.name}</TableCell>
                      <TableCell>{song.artist}</TableCell>
                      <TableCell>{formatDate(song.downloadDate)}</TableCell>
                      <TableCell>{formatDuration(song.duration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2
        }}>
          <Download sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No downloaded songs yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the download button while playing a song to save it
          </Typography>
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#282828',
            color: 'white',
          },
        }}
      >
        <MenuItem onClick={() => {
          handleDelete(selectedSong?.id);
          handleMenuClose();
        }}>
          <Delete sx={{ mr: 1 }} /> Delete Download
        </MenuItem>
      </Menu>

      {/* Downloads Player */}
      <DownloadsPlayer />
    </Box>
  );
};

export default Downloads;
