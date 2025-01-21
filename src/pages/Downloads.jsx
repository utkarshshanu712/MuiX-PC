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

  const loadDownloadedSongs = () => {
    try {
      const storedDownloads = JSON.parse(localStorage.getItem('downloads') || '[]');
      setDownloads(storedDownloads);
    } catch (error) {
      console.error('Failed to load downloads:', error);
      enqueueSnackbar('Failed to load downloads', { variant: 'error' });
    }
  };

  const handlePlaySong = (song) => {
    const offlineTrack = {
      id: song.id,
      name: song.title || song.name,
      title: song.title || song.name,
      primaryArtists: song.artist,
      artist: song.artist,
      image: [{ link: song.coverUrl }],
      downloadUrl: null,
      isLocal: true,
      audioUrl: song.audioUrl,
      duration: song.duration,
      type: 'song',
      playCount: 0,
      language: song.language || 'unknown'
    };
    
    const playlist = downloads
      .filter(d => d.id !== song.id)
      .map(d => ({
        id: d.id,
        name: d.title || d.name,
        title: d.title || d.name,
        primaryArtists: d.artist,
        artist: d.artist,
        image: [{ link: d.coverUrl }],
        downloadUrl: null,
        isLocal: true,
        audioUrl: d.audioUrl,
        duration: d.duration,
        type: 'song',
        playCount: 0,
        language: d.language || 'unknown'
      }));
    
    handlePlay(offlineTrack, playlist);
  };

  const handlePlayAll = (shuffle = false) => {
    if (downloads.length === 0) return;
    
    let tracks = downloads.map(song => ({
      id: song.id,
      name: song.title || song.name,
      title: song.title || song.name,
      primaryArtists: song.artist,
      artist: song.artist,
      image: [{ link: song.coverUrl }],
      downloadUrl: null,
      isLocal: true,
      audioUrl: song.audioUrl,
      duration: song.duration,
      type: 'song',
      playCount: 0,
      language: song.language || 'unknown'
    }));

    if (shuffle) {
      for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
      }
    }

    const [firstTrack, ...remainingTracks] = tracks;
    handlePlay(firstTrack, remainingTracks);
  };

  const handleDelete = (songId) => {
    try {
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
        mb: 4,
        bgcolor: 'rgba(29, 185, 84, 0.1)',
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
        width: '100%',
      }}>
        <Box sx={{ 
          width: { xs: '100%', sm: 150 },
          height: { xs: 150, sm: 150 },
          bgcolor: '#282828',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2
        }}>
          <Download sx={{ fontSize: { xs: 80, sm: 100 }, color: '#1db954' }} />
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <Typography variant="overline" color="text.secondary">Playlist</Typography>
          <Typography variant="h1" sx={{ 
            mb: 2, 
            fontSize: { xs: '1.5rem', sm: '2rem' }, 
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
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <IconButton
            onClick={() => handlePlayAll(false)}
            sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: '#1db954',
              '&:hover': { bgcolor: '#1ed760', transform: 'scale(1.04)' },
              transition: 'all 0.2s ease'
            }}
          >
            <PlayArrow sx={{ fontSize: { xs: 30, sm: 40 }, color: 'white' }} />
          </IconButton>

          <IconButton
            onClick={() => handlePlayAll(true)}
            sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: '#282828',
              '&:hover': { bgcolor: '#333', transform: 'scale(1.04)' },
              transition: 'all 0.2s ease'
            }}
          >
            <Shuffle sx={{ fontSize: { xs: 24, sm: 30 }, color: '#1db954' }} />
          </IconButton>
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
                    p: 1,
                    borderRadius: 1,
                    bgcolor: currentTrack?.id === song.id ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ 
                    width: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: currentTrack?.id === song.id ? '#1db954' : 'white'
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
                        color: 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {song.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {song.artist} • {formatDuration(song.duration)}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, song)}
                    sx={{ color: 'text.secondary' }}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : (
            // Desktop View
            <TableContainer sx={{ maxWidth: '100%' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '5%', md: '5%' } }}>#</TableCell>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '45%', md: '40%' } }}>Title</TableCell>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '25%', md: '30%' } }}>Date Added</TableCell>
                    <TableCell sx={{ color: 'text.secondary', width: { sm: '15%', md: '15%' } }}>
                      <AccessTime />
                    </TableCell>
                    <TableCell sx={{ width: { sm: '10%', md: '10%' } }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {downloads.map((song, index) => (
                    <TableRow
                      key={song.id}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: currentTrack?.id === song.id ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                      onClick={() => handlePlaySong(song)}
                    >
                      <TableCell sx={{ color: 'white' }}>
                        {currentTrack?.id === song.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', color: '#1db954' }}>
                            {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                          </Box>
                        ) : (
                          index + 1
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography sx={{ color: 'white' }}>
                            {song.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {song.artist}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {formatDate(song.downloadDate)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {formatDuration(song.duration)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, song)}
                          sx={{ color: 'text.secondary' }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
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
